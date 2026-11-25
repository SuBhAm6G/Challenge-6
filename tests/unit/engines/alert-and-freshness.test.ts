import { describe, expect, it } from 'vitest';
import type { AirQualityReading, AQIResult } from '../../../src/domain/air-quality/types.ts';
import { evaluateCleanAirAlerts } from '../../../src/engines/alert-engine.ts';
import { evaluateReadingFreshness } from '../../../src/engines/freshness.ts';
import { buildSampleWinterSmogBundle } from '../../../src/providers/sample-data.ts';
import { DEFAULT_ALERT_PREFERENCES } from '../../../src/store/defaults.ts';

const NOW = Date.parse('2026-11-25T12:00:00.000Z');

const BASE_OBSERVED: AirQualityReading = {
  id: 'r1',
  locationName: 'Delhi',
  city: 'New Delhi',
  latitude: 28.6,
  longitude: 77.2,
  sourceId: 'cpcb',
  sourceName: 'CPCB Station',
  sourceType: 'observation',
  spatialResolutionNote: 'Station',
  observationTime: '2026-11-25T11:30:00.000Z',
  retrievalTime: '2026-11-25T11:40:00.000Z',
  pollutants: [],
  forecastVsObserved: 'observed',
  qualityFlags: [],
};

const MAKE_AQI = (value: number, category: AQIResult['category']): AQIResult => ({
  value,
  category,
  standard: 'INDIA_NAQI',
  dominantPollutant: 'pm25',
  subIndices: [],
  coverageCount: 6,
  minimumCoverageMet: true,
  limitations: [],
});

describe('Freshness Engine', () => {
  it('returns unavailable when reading is null', () => {
    const res = evaluateReadingFreshness(null, NOW);
    expect(res.status).toBe('unavailable');
    expect(res.isStaleOrUncertain).toBe(true);
    expect(res.ageMinutes).toBeNull();
  });

  it('marks sample_data explicitly as synthetic demo and uncertain', () => {
    const { current } = buildSampleWinterSmogBundle();
    const res = evaluateReadingFreshness(current, NOW);
    expect(res.status).toBe('unavailable');
    expect(res.label).toContain('Sample Demo');
    expect(res.isStaleOrUncertain).toBe(true);
  });

  it('marks invalid timestamps as stale with null ageMinutes', () => {
    const res = evaluateReadingFreshness(
      { ...BASE_OBSERVED, retrievalTime: 'not-a-date', observationTime: 'bad' },
      NOW,
    );
    expect(res.status).toBe('stale');
    expect(res.ageMinutes).toBeNull();
    expect(res.isStaleOrUncertain).toBe(true);
  });

  it('classifies observed readings into recent (<=60m), delayed (<=180m), last_known (<=24h), and stale (>24h)', () => {
    expect(evaluateReadingFreshness(BASE_OBSERVED, NOW).status).toBe('recent');
    expect(
      evaluateReadingFreshness({ ...BASE_OBSERVED, retrievalTime: '2026-11-25T10:00:00.000Z' }, NOW)
        .status,
    ).toBe('delayed');
    expect(
      evaluateReadingFreshness({ ...BASE_OBSERVED, retrievalTime: '2026-11-25T05:00:00.000Z' }, NOW)
        .status,
    ).toBe('last_known');
    expect(
      evaluateReadingFreshness({ ...BASE_OBSERVED, retrievalTime: '2026-11-23T05:00:00.000Z' }, NOW)
        .status,
    ).toBe('stale');
  });

  it('classifies forecast readings into forecast (<=90m), delayed (<=360m), and last_known (>360m)', () => {
    const baseForecast: AirQualityReading = {
      ...BASE_OBSERVED,
      sourceType: 'model_forecast',
      forecastVsObserved: 'forecast',
    };
    expect(
      evaluateReadingFreshness({ ...baseForecast, retrievalTime: '2026-11-25T11:00:00.000Z' }, NOW)
        .status,
    ).toBe('forecast');
    expect(
      evaluateReadingFreshness({ ...baseForecast, retrievalTime: '2026-11-25T08:00:00.000Z' }, NOW)
        .status,
    ).toBe('delayed');
    expect(
      evaluateReadingFreshness({ ...baseForecast, retrievalTime: '2026-11-25T01:00:00.000Z' }, NOW)
        .status,
    ).toBe('last_known');
  });
});

describe('Alert Engine', () => {
  it('returns empty alerts when alerts are disabled or reading is null', () => {
    const { current, forecast } = buildSampleWinterSmogBundle();
    expect(
      evaluateCleanAirAlerts({
        reading: current,
        aqiResult: MAKE_AQI(410, 'Severe'),
        previousCategory: 'Poor',
        forecast,
        preferences: { ...DEFAULT_ALERT_PREFERENCES, enabled: false },
        hasAirPurifier: true,
      }),
    ).toEqual([]);

    expect(
      evaluateCleanAirAlerts({
        reading: null,
        aqiResult: MAKE_AQI(410, 'Severe'),
        previousCategory: null,
        forecast: null,
        preferences: DEFAULT_ALERT_PREFERENCES,
        hasAirPurifier: false,
      }),
    ).toEqual([]);
  });

  it('remains silent when category is below user alert threshold and no forecast spike exists', () => {
    const alerts = evaluateCleanAirAlerts({
      reading: BASE_OBSERVED,
      aqiResult: MAKE_AQI(95, 'Satisfactory'),
      previousCategory: 'Good',
      forecast: null,
      preferences: { ...DEFAULT_ALERT_PREFERENCES, notifyOnCategoryAtOrAbove: 'Poor' },
      hasAirPurifier: false,
      nowIso: '2026-11-25T12:00:00.000Z',
    });
    expect(alerts).toEqual([]);
  });

  it('notes worsening category transitions explicitly in alert message', () => {
    const alerts = evaluateCleanAirAlerts({
      reading: BASE_OBSERVED,
      aqiResult: MAKE_AQI(330, 'Very Poor'),
      previousCategory: 'Poor',
      forecast: null,
      preferences: DEFAULT_ALERT_PREFERENCES,
      hasAirPurifier: false,
      nowIso: '2026-11-25T12:00:00.000Z',
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.severity).toBe('high');
    expect(alerts[0]?.message).toContain('shifted from Poor to Very Poor');
  });

  it('labels sample alerts clearly and generates deduplicated keys', () => {
    const { current, forecast } = buildSampleWinterSmogBundle();
    const alerts = evaluateCleanAirAlerts({
      reading: current,
      aqiResult: MAKE_AQI(375, 'Very Poor'),
      previousCategory: 'Poor',
      forecast,
      preferences: DEFAULT_ALERT_PREFERENCES,
      hasAirPurifier: true,
      nowIso: '2026-11-25T08:00:00.000Z',
    });

    expect(alerts[0]?.title).toContain('Sample Alert:');
    const keys = alerts.map((a) => a.dedupKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('triggers purifier pre-filter maintenance reminder only after 14+ days', () => {
    const recentCheck = evaluateCleanAirAlerts({
      reading: BASE_OBSERVED,
      aqiResult: MAKE_AQI(45, 'Good'),
      previousCategory: 'Good',
      forecast: null,
      preferences: {
        ...DEFAULT_ALERT_PREFERENCES,
        notifyOnForecastShift: false,
        lastFilterReminderIso: '2026-11-20T08:00:00.000Z',
      },
      hasAirPurifier: true,
      nowIso: '2026-11-25T08:00:00.000Z',
    });
    expect(recentCheck.some((a) => a.type === 'indoor_maintenance_due')).toBe(false);

    const overdueCheck = evaluateCleanAirAlerts({
      reading: BASE_OBSERVED,
      aqiResult: MAKE_AQI(45, 'Good'),
      previousCategory: 'Good',
      forecast: null,
      preferences: {
        ...DEFAULT_ALERT_PREFERENCES,
        notifyOnForecastShift: false,
        lastFilterReminderIso: '2026-11-01T08:00:00.000Z',
      },
      hasAirPurifier: true,
      nowIso: '2026-11-25T08:00:00.000Z',
    });
    expect(overdueCheck.some((a) => a.type === 'indoor_maintenance_due')).toBe(true);
  });

  it('creates forecast spike alert when upcoming hours reach Very Poor (>=301)', () => {
    const { forecast } = buildSampleWinterSmogBundle();
    const alerts = evaluateCleanAirAlerts({
      reading: { ...BASE_OBSERVED, forecastVsObserved: 'forecast' },
      aqiResult: MAKE_AQI(180, 'Moderate'),
      previousCategory: 'Moderate',
      forecast,
      preferences: {
        ...DEFAULT_ALERT_PREFERENCES,
        notifyOnCategoryAtOrAbove: 'Poor',
        notifyOnForecastShift: true,
      },
      hasAirPurifier: false,
      nowIso: '2026-11-25T08:00:00.000Z',
    });
    expect(alerts.some((a) => a.type === 'forecast_spike_ahead')).toBe(true);
  });
});
