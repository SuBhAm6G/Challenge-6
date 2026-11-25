import { afterEach, describe, expect, it } from 'vitest';
import { handleChatRequest } from '../../../api/chat.ts';
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

describe('Serverless /api/chat Endpoint Security & Validation', () => {
  const originalKey = process.env.GOOGLE_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GOOGLE_API_KEY;
    } else {
      process.env.GOOGLE_API_KEY = originalKey;
    }
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

  it('rejects malformed JSON with 400 INVALID_JSON', async () => {
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
    delete process.env.GOOGLE_API_KEY;
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
});
