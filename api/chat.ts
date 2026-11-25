import { GoogleGenAI } from '@google/genai';
import {
  GEMINI_RESPONSE_SCHEMA,
  isRateLimited,
  jsonResponse,
  MAX_BODY_BYTES,
  RequestSchema,
  ResponseSchema,
  SYSTEM_INSTRUCTION,
} from './_guardrails.ts';

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
  } catch {
    return jsonResponse(400, { error: 'INVALID_JSON', message: 'Malformed JSON body.' });
  }

  const validatedReq = RequestSchema.safeParse(parsedBody);
  if (!validatedReq.success) {
    return jsonResponse(400, {
      error: 'VALIDATION_ERROR',
      message: 'Request payload failed validation.',
    });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === 'your_google_api_key_here') {
    return jsonResponse(503, {
      error: 'MISSING_API_KEY',
      message: 'Server AI credentials are not configured.',
    });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  const ai = new GoogleGenAI({ apiKey });

  const userPrompt = `CONTEXT_JSON (untrusted data boundaries):\n${JSON.stringify(
    validatedReq.data.context,
  )}\n\nHOUSEHOLD_QUESTION:\n${validatedReq.data.question}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RESPONSE_SCHEMA,
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      });

      const text = result.text?.trim();
      if (!text) {
        return jsonResponse(502, {
          error: 'EMPTY_AI_RESPONSE',
          message: 'Model returned an empty response.',
        });
      }

      const rawJson: unknown = JSON.parse(text);
      const checked = ResponseSchema.safeParse(rawJson);
      if (!checked.success) {
        return jsonResponse(502, {
          error: 'INVALID_AI_SCHEMA',
          message: 'AI output did not satisfy safety schema.',
        });
      }

      return jsonResponse(200, checked.data);
    } catch (err) {
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status: unknown }).status)
          : 500;
      if (status === 503 && attempt === 0) {
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      if (status === 429) {
        return jsonResponse(429, {
          error: 'AI_RATE_LIMIT',
          message: 'AI model rate limit reached; using local deterministic guidance.',
        });
      }
      return jsonResponse(502, {
        error: 'AI_PROVIDER_ERROR',
        message: 'Gemini assistant is temporarily unavailable; deterministic rules remain active.',
      });
    }
  }

  return jsonResponse(502, {
    error: 'AI_PROVIDER_ERROR',
    message: 'AI service unavailable.',
  });
}

export default {
  fetch: handleChatRequest,
};
