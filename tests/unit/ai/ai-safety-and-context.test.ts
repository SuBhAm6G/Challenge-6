import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  askSaansathiAssistant,
  buildDeterministicFallbackResponse,
} from '../../../src/ai/client.ts';
import { buildAiContextPackage } from '../../../src/ai/context-builder.ts';
import { hasUrgentMedicalSymptoms, sanitizeAiResponse } from '../../../src/ai/safety.ts';
import type { AiChatResponse } from '../../../src/ai/schemas.ts';
import { DEFAULT_DEMO_HOUSEHOLD, DEFAULT_DEMO_LOCATION } from '../../../src/data/cities.ts';
import type { AQIResult } from '../../../src/domain/air-quality/types.ts';
import { generateDailyRoutine } from '../../../src/engines/routine-engine.ts';
import { buildSampleWinterSmogBundle } from '../../../src/providers/sample-data.ts';
import { DEFAULT_INDOOR_PROFILE } from '../../../src/store/defaults.ts';

const HIGH_AQI: AQIResult = {
  value: 375,
  category: 'Very Poor',
  standard: 'INDIA_NAQI',
  dominantPollutant: 'pm25',
  subIndices: [
    { pollutant: 'pm25', concentration: 215, unit: 'µg/m³', subIndex: 375, category: 'Very Poor' },
  ],
  coverageCount: 6,
  minimumCoverageMet: true,
  limitations: [],
};

const UNAVAILABLE_AQI: AQIResult = {
  value: null,
  category: null,
  standard: 'INDIA_NAQI',
  dominantPollutant: null,
  subIndices: [],
  coverageCount: 0,
  minimumCoverageMet: false,
  limitations: ['Unavailable'],
};

function makeContext(aqi: AQIResult = HIGH_AQI) {
  const { current, forecast } = buildSampleWinterSmogBundle();
  const routine = generateDailyRoutine(DEFAULT_DEMO_HOUSEHOLD, aqi, forecast);
  const ctx = buildAiContextPackage({
    location: DEFAULT_DEMO_LOCATION,
    reading: aqi.value === null ? null : current,
    aqiResult: aqi,
    forecast: aqi.value === null ? null : forecast,
    household: DEFAULT_DEMO_HOUSEHOLD,
    indoor: DEFAULT_INDOOR_PROFILE,
    deterministicRoutine: routine,
  });
  return { ctx, routine };
}

describe('GenAI Privacy Context, Safety Rails & Fallback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('strips precise coordinates, locality street text, and household name from AI context', () => {
    const { ctx } = makeContext();
    const serialized = JSON.stringify(ctx);
    expect(ctx.city).toBe('New Delhi');
    expect(ctx.aqiStandard).toBe('India NAQI (CPCB)');
    expect(serialized).not.toContain('Dwarka Sector 10');
    expect(serialized).not.toContain('28.5921');
    expect(serialized).not.toContain('Sharma Family');
  });

  it('handles unavailable reading and forecast gracefully in AI context builder', () => {
    const { ctx, routine } = makeContext(UNAVAILABLE_AQI);
    expect(ctx.aqiValue).toBeNull();
    expect(ctx.isForecastOrSample).toBe('unavailable');
    expect(ctx.bestOutdoorWindowLabel).toBeNull();
    expect(ctx.pollutantSummary).toContain('unavailable');

    const fallback = buildDeterministicFallbackResponse(ctx, routine, 'Offline');
    expect(fallback.summary).toContain('currently unavailable');
    expect(fallback.dataLimitations[1]).toContain('No forecast window');
  });

  it('detects urgent respiratory symptoms across multiple phrases without calling AI', async () => {
    const { ctx, routine } = makeContext();
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    for (const phrase of [
      'My father has chest pain and cannot breathe',
      'Child is wheezing badly with blue lips',
      'Sudden fainting and severe breathlessness',
    ]) {
      expect(hasUrgentMedicalSymptoms(phrase)).toBe(true);
      const turn = await askSaansathiAssistant({
        question: phrase,
        context: ctx,
        deterministicRoutine: routine,
      });
      expect(turn.origin).toBe('urgent_medical_redirect');
      expect(turn.response.summary).toContain('112');
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('filters prohibited ozone, medication, kitchen-sealing, and citywide AQI claims', () => {
    const { ctx } = makeContext();
    const unsafeOutput: AiChatResponse = {
      summary:
        'Run an ozone generator indoors, stop your inhaler, seal the kitchen gas stove airtight, and this reduces citywide AQI by 15%.',
      recommendations: [
        {
          id: 'bad-cycle',
          action: 'Go cycling 15 km along the main road',
          timing: 'Morning',
          reason: 'Saves petrol',
          exposureConsideration: 'None',
          environmentalConsideration: 'Zero tailpipe',
          effort: 'no_cost',
          confidence: 'high',
          evidenceIds: ['cpcb-naqi', 'invented-url-id'],
          caveats: [],
        },
        {
          id: 'safe-indoor',
          action: 'Avoid cycling and do indoor yoga instead',
          timing: 'Morning',
          reason: 'Avoids PM2.5 spikes',
          exposureConsideration: 'Lowers exertion intake',
          environmentalConsideration: 'Neutral emissions',
          effort: 'no_cost',
          confidence: 'high',
          evidenceIds: ['cpcb-naqi'],
          caveats: [],
          safetyNote: 'Use an ozone generator only never',
        },
      ],
      dataLimitations: [],
      sourceIdsUsed: ['fake-source', 'cpcb-naqi'],
      disclaimer: 'Test',
    };

    const { sanitized, safetyWarnings } = sanitizeAiResponse(unsafeOutput, ctx);
    expect(sanitized.summary).not.toContain('Run an ozone generator');
    expect(sanitized.summary).not.toContain('stop your inhaler');
    expect(sanitized.summary).not.toContain('seal the kitchen gas stove');
    expect(sanitized.summary).not.toContain('reduces citywide AQI by 15');
    expect(sanitized.recommendations).toHaveLength(1);
    expect(sanitized.recommendations[0]?.id).toBe('safe-indoor');
    expect(sanitized.sourceIdsUsed).toEqual(['cpcb-naqi']);
    expect(safetyWarnings.length).toBeGreaterThanOrEqual(4);
  });

  it('defaults sourceIdsUsed to cpcb-naqi when LLM returns only invalid citations', () => {
    const { ctx } = makeContext();
    const output: AiChatResponse = {
      summary: 'Stay indoors this morning.',
      recommendations: [],
      dataLimitations: [],
      sourceIdsUsed: ['made-up-blog'],
      disclaimer: 'Draft',
    };
    const { sanitized } = sanitizeAiResponse(output, ctx);
    expect(sanitized.sourceIdsUsed).toEqual(['cpcb-naqi']);
  });

  it('returns validated groq_ai turn when server returns schema-compliant JSON', async () => {
    const { ctx, routine } = makeContext();
    const serverPayload: AiChatResponse = {
      summary:
        'Shift morning exercise indoors and batch afternoon errands around the forecast dip.',
      recommendations: [
        {
          id: 'rec-1',
          action: 'Indoor stretching',
          timing: '07:00 AM',
          reason: 'High morning inversion PM2.5',
          exposureConsideration: 'Lowers high-ventilation intake',
          environmentalConsideration: 'Neutral',
          effort: 'no_cost',
          confidence: 'high',
          evidenceIds: ['cpcb-naqi'],
          caveats: ['Keep kitchen exhaust running while cooking.'],
        },
      ],
      dataLimitations: ['Model grid estimate'],
      sourceIdsUsed: ['cpcb-naqi', 'who-aqg-2021'],
      disclaimer: 'Non-medical planning tool',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(serverPayload), { status: 200 })),
    );

    const turn = await askSaansathiAssistant({
      question: 'What should my family prioritize?',
      context: ctx,
      deterministicRoutine: routine,
    });
    expect(turn.origin).toBe('groq_ai');
    expect(turn.response.recommendations).toHaveLength(1);
    expect(turn.response.sourceIdsUsed).toContain('cpcb-naqi');
  });

  it('falls back cleanly when server returns invalid schema, HTTP error, or network outage', async () => {
    const { ctx, routine } = makeContext();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'Missing key' }), { status: 503 })),
    );
    const httpErr = await askSaansathiAssistant({
      question: 'What should my family prioritize today?',
      context: ctx,
      deterministicRoutine: routine,
    });
    expect(httpErr.origin).toBe('deterministic_fallback');
    expect(httpErr.errorDetail).toBe('Missing key');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ summary: 123 }), { status: 200 })),
    );
    const schemaErr = await askSaansathiAssistant({
      question: 'What should my family prioritize today?',
      context: ctx,
      deterministicRoutine: routine,
    });
    expect(schemaErr.origin).toBe('deterministic_fallback');
    expect(schemaErr.errorDetail).toContain('schema');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('Offline');
      }),
    );
    const netErr = await askSaansathiAssistant({
      question: 'What should my family prioritize today?',
      context: ctx,
      deterministicRoutine: routine,
    });
    expect(netErr.origin).toBe('deterministic_fallback');
    expect(netErr.response.recommendations.length).toBeGreaterThan(0);

    // Caller AbortSignal cancellation
    const controller = new AbortController();
    controller.abort();
    const aborted = await askSaansathiAssistant({
      question: 'What should my family prioritize today?',
      context: ctx,
      deterministicRoutine: routine,
      signal: controller.signal,
    });
    expect(aborted.origin).toBe('deterministic_fallback');
  });
});
