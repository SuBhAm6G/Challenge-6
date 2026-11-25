import { describe, expect, it } from 'vitest';
import type { PollutantReading } from '../../../src/domain/air-quality/types.ts';
import {
  computePollutantSubIndex,
  interpretIndiaNAQI,
} from '../../../src/engines/aqi-interpreter.ts';

describe('AQI Interpreter (India NAQI)', () => {
  it('computes exact CPCB India NAQI category boundaries for PM2.5', () => {
    expect(computePollutantSubIndex('pm25', 0)?.category).toBe('Good');
    expect(computePollutantSubIndex('pm25', 30)).toMatchObject({ subIndex: 50, category: 'Good' });
    expect(computePollutantSubIndex('pm25', 60)).toMatchObject({
      subIndex: 100,
      category: 'Satisfactory',
    });
    expect(computePollutantSubIndex('pm25', 90)).toMatchObject({
      subIndex: 200,
      category: 'Moderate',
    });
    expect(computePollutantSubIndex('pm25', 120)).toMatchObject({
      subIndex: 300,
      category: 'Poor',
    });
    expect(computePollutantSubIndex('pm25', 250)).toMatchObject({
      subIndex: 400,
      category: 'Very Poor',
    });
    expect(computePollutantSubIndex('pm25', 300)?.category).toBe('Severe');
  });

  it('computes exact midpoint linear interpolation within a PM2.5 bracket', () => {
    const mid = computePollutantSubIndex('pm25', 15);
    expect(mid?.subIndex).toBe(25);
    expect(mid?.category).toBe('Good');
  });

  it('computes PM10, NO2, SO2, and O3 CPCB sub-indices accurately', () => {
    expect(computePollutantSubIndex('pm10', 250)).toMatchObject({
      subIndex: 200,
      category: 'Moderate',
    });
    expect(computePollutantSubIndex('no2', 180)).toMatchObject({
      subIndex: 200,
      category: 'Moderate',
    });
    expect(computePollutantSubIndex('so2', 80)).toMatchObject({
      subIndex: 100,
      category: 'Satisfactory',
    });
    expect(computePollutantSubIndex('o3', 168)).toMatchObject({
      subIndex: 200,
      category: 'Moderate',
    });
  });

  it('selects maximum sub-index as overall NAQI and dominant pollutant', () => {
    const readings: PollutantReading[] = [
      { pollutant: 'pm25', concentration: 185, unit: 'µg/m³', averagingPeriod: '24h' },
      { pollutant: 'pm10', concentration: 210, unit: 'µg/m³', averagingPeriod: '24h' },
      { pollutant: 'no2', concentration: 65, unit: 'µg/m³', averagingPeriod: '24h' },
    ];
    const res = interpretIndiaNAQI(readings, 'INDIA_NAQI');
    expect(res.minimumCoverageMet).toBe(true);
    expect(res.dominantPollutant).toBe('pm25');
    expect(res.category).toBe('Very Poor');
    expect(res.value).toBeGreaterThan(300);
    expect(res.limitations).toHaveLength(0);
  });

  it('keeps overall NAQI unavailable/null when zero valid readings are passed', () => {
    const res = interpretIndiaNAQI([]);
    expect(res.value).toBeNull();
    expect(res.category).toBeNull();
    expect(res.dominantPollutant).toBeNull();
    expect(res.minimumCoverageMet).toBe(false);
  });

  it('flags missing PM2.5/PM10 even when 3 gaseous pollutants are present', () => {
    const readings: PollutantReading[] = [
      { pollutant: 'no2', concentration: 50, unit: 'µg/m³', averagingPeriod: '24h' },
      { pollutant: 'so2', concentration: 20, unit: 'µg/m³', averagingPeriod: '24h' },
      { pollutant: 'o3', concentration: 60, unit: 'µg/m³', averagingPeriod: '8h' },
    ];
    const res = interpretIndiaNAQI(readings);
    expect(res.minimumCoverageMet).toBe(false);
    expect(res.coverageCount).toBe(3);
    expect(res.limitations.some((l) => l.includes('PM2.5 or PM10'))).toBe(true);
  });

  it('flags incomplete coverage when fewer than 3 pollutants are provided', () => {
    const readings: PollutantReading[] = [
      { pollutant: 'pm25', concentration: 75, unit: 'µg/m³', averagingPeriod: '24h' },
      { pollutant: 'no2', concentration: 30, unit: 'µg/m³', averagingPeriod: '24h' },
    ];
    const res = interpretIndiaNAQI(readings);
    expect(res.minimumCoverageMet).toBe(false);
    expect(res.coverageCount).toBe(2);
    expect(res.limitations.some((l) => l.includes('at least 3 pollutants'))).toBe(true);
  });

  it('notes averaging period mismatch when 1h model readings are supplied', () => {
    const readings: PollutantReading[] = [
      { pollutant: 'pm25', concentration: 45, unit: 'µg/m³', averagingPeriod: '1h' },
      { pollutant: 'pm10', concentration: 80, unit: 'µg/m³', averagingPeriod: '1h' },
      { pollutant: 'o3', concentration: 50, unit: 'µg/m³', averagingPeriod: '1h' },
    ];
    const res = interpretIndiaNAQI(readings);
    expect(res.limitations.some((l) => l.includes('hourly model concentrations'))).toBe(true);
  });

  it('converts CO from µg/m³ to mg/m³ accurately and supports native mg/m³', () => {
    const ugRes = interpretIndiaNAQI([
      { pollutant: 'pm25', concentration: 20, unit: 'µg/m³', averagingPeriod: '24h' },
      { pollutant: 'pm10', concentration: 40, unit: 'µg/m³', averagingPeriod: '24h' },
      { pollutant: 'co', concentration: 2000, unit: 'µg/m³', averagingPeriod: '8h' },
    ]);
    expect(ugRes.subIndices.find((s) => s.pollutant === 'co')?.subIndex).toBe(100);

    const mgRes = computePollutantSubIndex('co', 2.0);
    expect(mgRes?.subIndex).toBe(100);
  });

  it('refuses to silently substitute another country AQI scale', () => {
    const readings: PollutantReading[] = [
      { pollutant: 'pm25', concentration: 50, unit: 'µg/m³', averagingPeriod: '24h' },
    ];
    const res = interpretIndiaNAQI(readings, 'US_EPA');
    expect(res.value).toBeNull();
    expect(res.category).toBeNull();
    expect(res.limitations[0]).toContain('never substitutes');
  });

  it('ignores negative/NaN/Infinity measurements and clamps extreme >500 breakpoints', () => {
    expect(computePollutantSubIndex('pm25', -5)).toBeNull();
    expect(computePollutantSubIndex('pm25', Number.NaN)).toBeNull();
    expect(computePollutantSubIndex('pm25', Number.POSITIVE_INFINITY)).toBeNull();
    const extreme = computePollutantSubIndex('pm25', 600);
    expect(extreme?.category).toBe('Severe');
    expect(extreme?.subIndex).toBeGreaterThan(500);
    expect(extreme?.cappedAbove500).toBe(true);
  });

  it('computes all 6 CPCB tiers accurately for PM10 and NO2', () => {
    const pm10Checks: [number, string][] = [
      [25, 'Good'],
      [75, 'Satisfactory'],
      [180, 'Moderate'],
      [300, 'Poor'],
      [390, 'Very Poor'],
      [480, 'Severe'],
    ];
    for (const [val, expectedCat] of pm10Checks) {
      expect(computePollutantSubIndex('pm10', val)?.category).toBe(expectedCat);
    }

    const no2Checks: [number, string][] = [
      [20, 'Good'],
      [60, 'Satisfactory'],
      [120, 'Moderate'],
      [220, 'Poor'],
      [340, 'Very Poor'],
      [450, 'Severe'],
    ];
    for (const [val, expectedCat] of no2Checks) {
      expect(computePollutantSubIndex('no2', val)?.category).toBe(expectedCat);
    }
  });

  it('deduplicates repeated pollutant entries using the first valid concentration', () => {
    const res = interpretIndiaNAQI([
      { pollutant: 'pm25', concentration: 45, unit: 'µg/m³', averagingPeriod: '24h' },
      { pollutant: 'pm25', concentration: 300, unit: 'µg/m³', averagingPeriod: '24h' },
      { pollutant: 'pm10', concentration: 80, unit: 'µg/m³', averagingPeriod: '24h' },
      { pollutant: 'no2', concentration: 30, unit: 'µg/m³', averagingPeriod: '24h' },
    ]);
    expect(res.subIndices.filter((s) => s.pollutant === 'pm25')).toHaveLength(1);
    expect(res.category).toBe('Satisfactory');
  });
});
