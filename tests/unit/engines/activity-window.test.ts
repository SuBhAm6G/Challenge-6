import { describe, expect, it } from 'vitest';
import type { AirQualityForecast } from '../../../src/domain/air-quality/types.ts';
import { findBestOutdoorWindows, formatHourRange } from '../../../src/engines/activity-window.ts';
import { buildSampleWinterSmogBundle } from '../../../src/providers/sample-data.ts';

function makeForecast(points: { hour: number; aqi: number | null }[]): AirQualityForecast {
  const base = new Date('2026-11-25T00:00:00');
  return {
    locationName: 'Test Locality',
    city: 'New Delhi',
    sourceId: 'test',
    sourceName: 'Test Forecast',
    sourceType: 'model_forecast',
    spatialResolutionNote: 'Test grid',
    retrievalTime: base.toISOString(),
    hourly: points.map((p) => {
      const ts = new Date(base.getTime());
      ts.setHours(p.hour, 0, 0, 0);
      return {
        timestamp: ts.toISOString(),
        pollutants: [],
        estimatedIndiaNaqi: p.aqi,
        estimatedCategory: p.aqi === null ? null : p.aqi <= 100 ? 'Satisfactory' : 'Poor',
        dominantPollutant: p.aqi === null ? null : 'pm25',
      };
    }),
  };
}

describe('Activity Window Scanner', () => {
  it('returns empty array when forecast is null or has fewer than 2 points', () => {
    expect(findBestOutdoorWindows(null)).toEqual([]);
    expect(findBestOutdoorWindows(makeForecast([{ hour: 12, aqi: 90 }]))).toEqual([]);
  });

  it('returns empty array when all timestamps are older than 1 hour before nowMs', () => {
    const forecast = makeForecast([
      { hour: 8, aqi: 120 },
      { hour: 9, aqi: 110 },
    ]);
    const farFuture = Date.parse('2026-11-28T00:00:00.000Z');
    expect(findBestOutdoorWindows(forecast, farFuture)).toEqual([]);
  });

  it('filters out late-night and pre-dawn hours outside 06:00–19:00 starts', () => {
    const now = Date.parse('2026-11-25T00:00:00');
    const forecast = makeForecast([
      { hour: 2, aqi: 30 },
      { hour: 3, aqi: 30 },
      { hour: 21, aqi: 40 },
      { hour: 22, aqi: 40 },
    ]);
    expect(findBestOutdoorWindows(forecast, now)).toEqual([]);
  });

  it('identifies the lowest 2-hour daytime dip sorted ascending by average NAQI', () => {
    const now = Date.parse('2026-11-25T05:00:00');
    const forecast = makeForecast([
      { hour: 7, aqi: 350 },
      { hour: 8, aqi: 330 },
      { hour: 14, aqi: 140 },
      { hour: 15, aqi: 120 },
      { hour: 16, aqi: 160 },
    ]);
    const windows = findBestOutdoorWindows(forecast, now);
    expect(windows).toHaveLength(2);
    expect(windows[0]?.startHour).toBe(14);
    expect(windows[0]?.endHour).toBe(16);
    expect(windows[0]?.averageEstimatedAqi).toBe(130);
    expect(windows[0]?.category).toBe('Moderate');
  });

  it('frames windows above 200 NAQI with explicit elevated-pollution caveats', () => {
    const now = Date.parse('2026-11-25T06:00:00');
    const forecast = makeForecast([
      { hour: 13, aqi: 240 },
      { hour: 14, aqi: 260 },
    ]);
    const windows = findBestOutdoorWindows(forecast, now);
    expect(windows[0]?.averageEstimatedAqi).toBe(250);
    expect(windows[0]?.category).toBe('Poor');
    expect(windows[0]?.confidenceNote).toContain('still elevated');
  });

  it('skips intervals containing null estimatedIndiaNaqi values', () => {
    const now = Date.parse('2026-11-25T06:00:00');
    const forecast = makeForecast([
      { hour: 10, aqi: null },
      { hour: 11, aqi: 90 },
      { hour: 12, aqi: 95 },
      { hour: 13, aqi: 85 },
    ]);
    const windows = findBestOutdoorWindows(forecast, now);
    expect(windows).toHaveLength(2);
    expect(windows[0]?.startHour).toBe(12);
    expect(windows[0]?.averageEstimatedAqi).toBe(90);
  });

  it('discovers the midday winter smog dip from sample data', () => {
    const { forecast } = buildSampleWinterSmogBundle();
    const firstTs = Date.parse(forecast.hourly[0]!.timestamp);
    const windows = findBestOutdoorWindows(forecast, firstTs);
    expect(windows.length).toBeGreaterThan(0);
    expect(windows[0]!.averageEstimatedAqi).toBeLessThan(350);
  });

  it('formats 12-hour AM/PM ranges cleanly including midnight and noon', () => {
    expect(formatHourRange(0, 2)).toBe('12:00 AM – 2:00 AM');
    expect(formatHourRange(11, 13)).toBe('11:00 AM – 1:00 PM');
    expect(formatHourRange(12, 14)).toBe('12:00 PM – 2:00 PM');
    expect(formatHourRange(23, 1)).toBe('11:00 PM – 1:00 AM');
  });
});
