import { describe, expect, it } from 'vitest';
import { DEFAULT_DEMO_HOUSEHOLD } from '../../../src/data/cities.ts';
import type { AQIResult } from '../../../src/domain/air-quality/types.ts';
import { generateDailyRoutine } from '../../../src/engines/routine-engine.ts';
import { buildSampleWinterSmogBundle } from '../../../src/providers/sample-data.ts';

const SEVERE_AQI: AQIResult = {
  value: 415,
  category: 'Severe',
  standard: 'INDIA_NAQI',
  dominantPollutant: 'pm25',
  subIndices: [],
  coverageCount: 6,
  minimumCoverageMet: true,
  limitations: [],
};

const MODERATE_AQI: AQIResult = { ...SEVERE_AQI, value: 145, category: 'Moderate' };
const GOOD_AQI: AQIResult = {
  ...SEVERE_AQI,
  value: 42,
  category: 'Good',
  dominantPollutant: 'pm10',
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

describe('Routine Generation Engine', () => {
  it('moves vigorous morning exercise indoors during Severe AQI and offers afternoon window if forecast exists', () => {
    const { forecast } = buildSampleWinterSmogBundle();
    const recs = generateDailyRoutine(DEFAULT_DEMO_HOUSEHOLD, SEVERE_AQI, forecast);
    const morning = recs.find((r) => r.period === 'morning');
    expect(morning?.id).toBe('rec-morning-indoor-swap');
    expect(morning?.title.toLowerCase()).toContain('indoors');
    expect(morning?.caveats.some((c) => c.includes('do not guarantee'))).toBe(true);
  });

  it('tightens Moderate AQI morning exercise threshold when priority protection flags are set', () => {
    const sensitive = { ...DEFAULT_DEMO_HOUSEHOLD, protectionFlags: ['children' as const] };
    const sensitiveRecs = generateDailyRoutine(sensitive, MODERATE_AQI, null);
    expect(sensitiveRecs.find((r) => r.period === 'morning')?.id).toBe('rec-morning-indoor-swap');

    const general = { ...DEFAULT_DEMO_HOUSEHOLD, protectionFlags: [] };
    const generalRecs = generateDailyRoutine(general, MODERATE_AQI, null);
    expect(generalRecs.find((r) => r.period === 'morning')?.id).toBe('rec-morning-park-route');
  });

  it('omits morning exercise recommendation when habit is none', () => {
    const recs = generateDailyRoutine(
      { ...DEFAULT_DEMO_HOUSEHOLD, outdoorExerciseHabit: 'none' },
      SEVERE_AQI,
      null,
    );
    expect(recs.some((r) => r.period === 'morning')).toBe(false);
  });

  it('never suggests cycling as a commute shift during Severe AQI', () => {
    const { forecast } = buildSampleWinterSmogBundle();
    const recs = generateDailyRoutine(DEFAULT_DEMO_HOUSEHOLD, SEVERE_AQI, forecast);
    const commute = recs.find((r) => r.period === 'commute_am');
    expect(commute).toBeDefined();
    expect(commute?.title.toLowerCase()).not.toContain('bicycle');
    expect(
      commute?.caveats.some((c) => c.includes('NOT recommend switching long commutes to cycling')),
    ).toBe(true);
  });

  it('recommends remote days for hybrid workers and carpool for short (<6 km) office commutes', () => {
    const hybridRecs = generateDailyRoutine(
      { ...DEFAULT_DEMO_HOUSEHOLD, workPattern: 'hybrid' },
      SEVERE_AQI,
      null,
    );
    expect(hybridRecs.find((r) => r.id === 'rec-commute-shift')?.title).toContain('remote');

    const shortOfficeRecs = generateDailyRoutine(
      { ...DEFAULT_DEMO_HOUSEHOLD, workPattern: 'office', commuteDistanceKmOneWay: 4 },
      SEVERE_AQI,
      null,
    );
    expect(shortOfficeRecs.find((r) => r.id === 'rec-commute-shift')?.title).toContain('carpool');
  });

  it('adapts to outdoor workers without encouraging unsafe PPE bypass', () => {
    const workerProfile = {
      ...DEFAULT_DEMO_HOUSEHOLD,
      workPattern: 'outdoor_work' as const,
      hasSchoolGoingChildren: false,
    };
    const recs = generateDailyRoutine(workerProfile, SEVERE_AQI, null);
    const workRec = recs.find((r) => r.id === 'rec-outdoor-worker');
    expect(workRec).toBeDefined();
    expect(workRec?.caveats.some((c) => c.includes('Never bypass required workplace PPE'))).toBe(
      true,
    );
    expect(recs.some((r) => r.id === 'rec-school-planning')).toBe(false);
  });

  it('handles unavailable AQI data honestly without inventing conditions', () => {
    const recs = generateDailyRoutine(DEFAULT_DEMO_HOUSEHOLD, UNAVAILABLE_AQI, null);
    const morning = recs.find((r) => r.period === 'morning');
    expect(morning?.id).toBe('rec-morning-unavailable');
    expect(morning?.confidence).toBe('limited');
  });

  it('permits park-route outdoor exercise when AQI is Good', () => {
    const recs = generateDailyRoutine(DEFAULT_DEMO_HOUSEHOLD, GOOD_AQI, null);
    const morning = recs.find((r) => r.period === 'morning');
    expect(morning?.id).toBe('rec-morning-park-route');
  });

  it('includes school gate idling prevention and evening inversion precautions in severe episodes', () => {
    const recs = generateDailyRoutine(DEFAULT_DEMO_HOUSEHOLD, SEVERE_AQI, null);
    expect(recs.find((r) => r.id === 'rec-school-planning')?.title).toContain('school gates');
    expect(recs.find((r) => r.id === 'rec-evening-winddown')?.title).toContain('windows closed');
  });
});
