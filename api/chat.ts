import {
  isRateLimited,
  jsonResponse,
  MAX_BODY_BYTES,
  RequestSchema,
  ResponseSchema,
  SYSTEM_INSTRUCTION,
} from './_guardrails.ts';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
] as const;

/**
 * Removes optional Markdown JSON code fences around an LLM completion string.
 */
export function stripJsonFences(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function buildModelCandidates(configured: string | undefined): string[] {
  const ordered = [...(configured?.trim() ? [configured.trim()] : []), ...DEFAULT_GROQ_MODELS];
  return Array.from(new Set(ordered));
}

/**
 * Normalizes common LLM JSON shape drift (object-keyed arrays or string lists)
 * before strict Zod validation.
 */
export function normalizeLlmJson(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const obj = { ...(raw as Record<string, unknown>) };
  if (typeof obj.dataLimitations === 'string') obj.dataLimitations = [obj.dataLimitations];
  if (!Array.isArray(obj.dataLimitations)) obj.dataLimitations = [];
  if (typeof obj.sourceIdsUsed === 'string') obj.sourceIdsUsed = [obj.sourceIdsUsed];
  if (!Array.isArray(obj.sourceIdsUsed)) obj.sourceIdsUsed = ['cpcb-naqi'];
  if (
    obj.recommendations &&
    !Array.isArray(obj.recommendations) &&
    typeof obj.recommendations === 'object'
  ) {
    obj.recommendations = Object.values(obj.recommendations as Record<string, unknown>);
  }
  if (!Array.isArray(obj.recommendations)) obj.recommendations = [];
  if (typeof obj.disclaimer !== 'string' || !obj.disclaimer.trim()) {
    obj.disclaimer = 'Environmental planning guidance only—not medical advice.';
  }
  return obj;
}

const JSON_CONTRACT_HINT = `Return ONLY a valid JSON object with these exact keys:
- "summary" (string)
- "recommendations" (array of up to 4 objects, each with: "id", "action", "timing", "reason", "exposureConsideration", "environmentalConsideration", "effort" ("no_cost"|"low_effort"|"moderate_effort"), "confidence" ("high"|"moderate"|"limited"), "evidenceIds" (string[]), "caveats" (string[]), optional "alternative", optional "safetyNote")
- "followUpQuestion" (optional string)
- "dataLimitations" (string[])
- "sourceIdsUsed" (string[])
- "disclaimer" (string)`;

/**
 * Handles `POST /api/chat` requests against Groq's OpenAI-compatible chat endpoint
 * with automatic multi-model fallback and Zod payload gating.
 */
export async function handleChatRequest(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'METHOD_NOT_ALLOWED', message: 'Use POST.' });
  }

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local-client';
  if (isRateLimited(clientIp)) {
    return jsonResponse(429, {
      error: 'RATE_LIMITED',
      message: 'Too many requests. Please wait a minute before asking again.',
    });
  }

  const rawText = await request.text();
  if (rawText.length > MAX_BODY_BYTES) {
    return jsonResponse(413, {
      error: 'PAYLOAD_TOO_LARGE',
      message: 'Request exceeds maximum allowed size.',
    });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawText);
  } catch (err) {
    void err;
    return jsonResponse(400, { error: 'INVALID_JSON', message: 'Malformed JSON body.' });
  }

  const validatedReq = RequestSchema.safeParse(parsedBody);
  if (!validatedReq.success) {
    return jsonResponse(400, {
      error: 'VALIDATION_ERROR',
      message: 'Request payload failed validation.',
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return jsonResponse(503, {
      error: 'MISSING_API_KEY',
      message: 'Server AI credentials are not configured.',
    });
  }

  const candidates = buildModelCandidates(process.env.GROQ_MODEL);
  const userPrompt = `CONTEXT_JSON (untrusted data boundaries):\n${JSON.stringify(
    validatedReq.data.context,
  )}\n\nHOUSEHOLD_QUESTION:\n${validatedReq.data.question}`;

  let lastStatus = 502;
  for (const model of candidates) {
    try {
      const res = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: `${SYSTEM_INSTRUCTION}\n\n${JSON_CONTRACT_HINT}` },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 2048,
        }),
      });

      if (!res.ok) {
        lastStatus = res.status;
        if (res.status === 503 || res.status === 429 || res.status === 404) {
          continue;
        }
        break;
      }

      const payload = (await res.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };
      const rawContent = payload.choices?.[0]?.message?.content;
      const text = rawContent ? stripJsonFences(rawContent) : '';
      if (!text) continue;

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(text);
      } catch (parseErr) {
        void parseErr;
        lastStatus = 502;
        continue;
      }

      const rawJson: unknown = normalizeLlmJson(parsedJson);
      const checked = ResponseSchema.safeParse(rawJson);
      if (!checked.success) {
        lastStatus = 502;
        continue;
      }

      return jsonResponse(200, checked.data);
    } catch (networkErr) {
      void networkErr;
      lastStatus = 502;
    }
  }

  if (lastStatus === 429) {
    return jsonResponse(429, {
      error: 'AI_RATE_LIMIT',
      message: 'AI model rate limit reached; using local deterministic guidance.',
    });
  }

  return jsonResponse(502, {
    error: 'AI_PROVIDER_ERROR',
    message: 'Groq AI assistant is temporarily unavailable; deterministic rules remain active.',
  });
}

export default {
  fetch: handleChatRequest,
};
