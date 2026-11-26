import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleChatRequest, normalizeLlmJson, stripJsonFences } from '../../../api/chat.ts';
import { buildAiContextPackage } from '../../../src/ai/context-builder.ts';
import { DEFAULT_DEMO_HOUSEHOLD, DEFAULT_DEMO_LOCATION } from '../../../src/data/cities.ts';
import { interpretIndiaNAQI } from '../../../src/engines/aqi-interpreter.ts';
import { generateDailyRoutine } from '../../../src/engines/routine-engine.ts';
import { buildSampleWinterSmogBundle } from '../../../src/providers/sample-data.ts';
import { DEFAULT_INDOOR_PROFILE } from '../../../src/store/defaults.ts';

function validContext() {
  const { current, forecast } = buildSampleWinterSmogBundle();
  const aqiResult = interpretIndiaNAQI(current.pollutants);
  const routine = generateDailyRoutine(DEFAULT_DEMO_HOUSEHOLD, aqiResult, forecast);
  return buildAiContextPackage({
    location: DEFAULT_DEMO_LOCATION,
    reading: current,
    aqiResult,
    forecast,
    household: DEFAULT_DEMO_HOUSEHOLD,
    indoor: DEFAULT_INDOOR_PROFILE,
    deterministicRoutine: routine,
  });
}

function validGroqPayload() {
  return {
    summary: 'Keep vigorous morning workouts indoors during Very Poor NAQI.',
    recommendations: [
      {
        id: 'rec-1',
        action: 'Indoor stretching',
        timing: '07:00 AM',
        reason: 'Morning inversion concentrates PM2.5.',
        exposureConsideration: 'Reduces elevated breathing intake.',
        environmentalConsideration: 'Zero direct emissions.',
        effort: 'no_cost',
        confidence: 'high',
        evidenceIds: ['cpcb-naqi'],
        caveats: ['Keep kitchen exhaust running while cooking.'],
      },
    ],
    dataLimitations: ['Model forecast estimate (~11 km).'],
    sourceIdsUsed: ['cpcb-naqi'],
    disclaimer: 'Planning guidance only.',
  };
}

describe('Serverless /api/chat Endpoint Security, Fallbacks & Normalization', () => {
  const originalKey = process.env.GROQ_API_KEY;
  const originalModel = process.env.GROQ_MODEL;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GROQ_MODEL;
    else process.env.GROQ_MODEL = originalModel;
  });

  it('strips markdown JSON fences cleanly across variants', () => {
    expect(stripJsonFences('```json\n{"summary":"ok"}\n```')).toBe('{"summary":"ok"}');
    expect(stripJsonFences('```{"summary":"ok"}```')).toBe('{"summary":"ok"}');
    expect(stripJsonFences('  {"summary":"ok"}  ')).toBe('{"summary":"ok"}');
  });

  it('normalizes drifted LLM JSON shapes into schema-compatible fields', () => {
    expect(normalizeLlmJson(null)).toBeNull();
    expect(normalizeLlmJson(['raw'])).toEqual(['raw']);

    const normalized = normalizeLlmJson({
      summary: 'Test',
      recommendations: { '0': { id: 'a' } },
      dataLimitations: 'Single limitation string',
      sourceIdsUsed: 'who-aqg-2021',
      disclaimer: '   ',
    }) as Record<string, unknown>;

    expect(Array.isArray(normalized.recommendations)).toBe(true);
    expect(normalized.dataLimitations).toEqual(['Single limitation string']);
    expect(normalized.sourceIdsUsed).toEqual(['who-aqg-2021']);
    expect(typeof normalized.disclaimer).toBe('string');
    expect((normalized.disclaimer as string).length).toBeGreaterThan(10);

    const defaulted = normalizeLlmJson({ summary: 'Only summary' }) as Record<string, unknown>;
    expect(defaulted.recommendations).toEqual([]);
    expect(defaulted.sourceIdsUsed).toEqual(['cpcb-naqi']);
  });

  it('rejects non-POST HTTP methods with 405', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'GET',
      headers: { 'x-forwarded-for': '10.0.0.1' },
    });
    const res = await handleChatRequest(req);
    expect(res.status).toBe(405);
  });

  it('rejects oversized bodies (> 8 KB) with 413 PAYLOAD_TOO_LARGE', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.2', 'content-type': 'application/json' },
      body: 'x'.repeat(9000),
    });
    const res = await handleChatRequest(req);
    expect(res.status).toBe(413);
  });

  it('rejects malformed or empty JSON with 400 INVALID_JSON', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.3', 'content-type': 'application/json' },
      body: '{invalid-json',
    });
    const res = await handleChatRequest(req);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('INVALID_JSON');
  });

  it('rejects requests failing Zod payload bounds with 400 VALIDATION_ERROR', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.4', 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'x', context: {} }),
    });
    const res = await handleChatRequest(req);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('VALIDATION_ERROR');
  });

  it('returns 503 MISSING_API_KEY gracefully when server credentials are absent', async () => {
    delete process.env.GROQ_API_KEY;
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.5', 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'What should my family prioritize today?',
        context: validContext(),
      }),
    });
    const res = await handleChatRequest(req);
    expect(res.status).toBe(503);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('MISSING_API_KEY');
  });

  it('returns 200 OK with normalized Groq JSON and cascades across fallback models on 503/429', async () => {
    process.env.GROQ_API_KEY = 'test-groq-secret';
    process.env.GROQ_MODEL = 'openai/gpt-oss-120b';

    const fencedBody = `\`\`\`json\n${JSON.stringify({
      ...validGroqPayload(),
      recommendations: { first: validGroqPayload().recommendations[0] },
    })}\n\`\`\``;

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('Busy', { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: fencedBody } }] }), {
          status: 200,
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.6', 'content-type': 'application/json' },
      body: JSON.stringify({
        question: 'What should my family prioritize today?',
        context: validContext(),
      }),
    });

    const res = await handleChatRequest(req);
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const data = (await res.json()) as { summary: string; recommendations: unknown[] };
    expect(data.summary).toContain('indoors');
    expect(data.recommendations).toHaveLength(1);
  });

  it('returns 502 on malformed LLM JSON and 429 AI_RATE_LIMIT when all models rate-limit', async () => {
    process.env.GROQ_API_KEY = 'test-groq-secret';

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ choices: [{ message: { content: 'not-valid-json' } }] }), {
            status: 200,
          }),
      ),
    );
    const malformedReq = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.7', 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'Morning walk advice?', context: validContext() }),
    });
    const malformedRes = await handleChatRequest(malformedReq);
    expect(malformedRes.status).toBe(502);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('Rate limited', { status: 429 })),
    );
    const rateReq = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.8', 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'Morning walk advice?', context: validContext() }),
    });
    const rateRes = await handleChatRequest(rateReq);
    expect(rateRes.status).toBe(429);
    const rateJson = (await rateRes.json()) as { error: string };
    expect(rateJson.error).toBe('AI_RATE_LIMIT');
  });

  it('enforces 20 requests/minute IP rate limit and returns 429 RATE_LIMITED on request 21', async () => {
    delete process.env.GROQ_API_KEY;
    const body = JSON.stringify({
      question: 'What should my family prioritize today?',
      context: validContext(),
    });
    for (let i = 0; i < 20; i++) {
      const res = await handleChatRequest(
        new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: { 'x-forwarded-for': '10.0.0.99', 'content-type': 'application/json' },
          body,
        }),
      );
      expect(res.status).toBe(503);
    }
    const blocked = await handleChatRequest(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'x-forwarded-for': '10.0.0.99', 'content-type': 'application/json' },
        body,
      }),
    );
    expect(blocked.status).toBe(429);
    const json = (await blocked.json()) as { error: string };
    expect(json.error).toBe('RATE_LIMITED');
  });
});
