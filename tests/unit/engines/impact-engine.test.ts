import { describe, expect, it } from 'vitest';
import type { AQIResult } from '../../../src/domain/air-quality/types.ts';
import {
  buildImpactExplanation,
  calculateTransportImpact,
} from '../../../src/engines/impact-engine.ts';

const SEVERE_AQI: AQIResult = {
  value: 410,
  category: 'Severe',
  standard: 'INDIA_NAQI',
  dominantPollutant: 'pm25',
  subIndices: [],
  coverageCount: 6,
  minimumCoverageMet: true,
  limitations: [],
};

const GOOD_AQI: AQIResult = {
  value: 45,
  category: 'Good',
  standard: 'INDIA_NAQI',
  dominantPollutant: 'pm10',
  subIndices: [],
  coverageCount: 6,
  minimumCoverageMet: true,
  limitations: [],
};

describe('Choice Impact Engine', () => {
  it('calculates illustrative CO2e savings for petrol car to metro shift without fabricating PM2.5', () => {
    const calc = calculateTransportImpact({
      id: 'test-1',
      originalMode: 'car_petrol',
      alternativeMode: 'metro',
      oneWayDistanceKm: 15,
      tripsPerWeek: 4,
    });
    expect(calc.calculable).toBe(true);
    expect(calc.co2eAvoidedKgPerWeek).toBe(8.16);
    expect(calc.tripsAvoidedPerWeek).toBe(4);
    expect(calc.pm25AvoidedGramsPerWeek).toBeNull();
    expect(calc.noxAvoidedGramsPerWeek).toBeNull();
  });

  it('calculates tailpipe PM2.5 & NOx savings when both modes have documented factors', () => {
    const calc = calculateTransportImpact({
      id: 'test-2',
      originalMode: 'car_diesel',
      alternativeMode: 'carpool',
      oneWayDistanceKm: 10,
      tripsPerWeek: 5,
    });
    expect(calc.calculable).toBe(true);
    expect(calc.co2eAvoidedKgPerWeek).toBe(4.3);
    expect(calc.pm25AvoidedGramsPerWeek).toBe(1.3);
    expect(calc.noxAvoidedGramsPerWeek).toBe(17.4);
  });

  it('calculates remote workdays from motorcycle with zero alternative emissions', () => {
    const calc = calculateTransportImpact({
      id: 'test-moto-remote',
      originalMode: 'motorcycle',
      alternativeMode: 'remote',
      oneWayDistanceKm: 12,
      tripsPerWeek: 4,
    });
    expect(calc.calculable).toBe(true);
    expect(calc.co2eAvoidedKgPerWeek).toBe(2.02);
    expect(calc.pm25AvoidedGramsPerWeek).toBe(0.58);
    expect(calc.tripsAvoidedPerWeek).toBe(4);
  });

  it('does not inflate solo vehicle trips avoided when shifting between shared modes', () => {
    const calc = calculateTransportImpact({
      id: 'test-bus-metro',
      originalMode: 'bus',
      alternativeMode: 'metro',
      oneWayDistanceKm: 10,
      tripsPerWeek: 10,
    });
    expect(calc.calculable).toBe(true);
    expect(calc.tripsAvoidedPerWeek).toBe(0);
    expect(calc.co2eAvoidedKgPerWeek).toBe(0.9);
  });

  it('never yields negative CO2e savings when alternative has higher or equal factor', () => {
    const calc = calculateTransportImpact({
      id: 'test-same',
      originalMode: 'metro',
      alternativeMode: 'car_petrol',
      oneWayDistanceKm: 10,
      tripsPerWeek: 4,
    });
    expect(calc.co2eAvoidedKgPerWeek).toBe(0);
  });

  it('falls back to qualitative explanation when distance or trips is zero/invalid', () => {
    for (const badInput of [
      { oneWayDistanceKm: 0, tripsPerWeek: 4 },
      { oneWayDistanceKm: -5, tripsPerWeek: 4 },
      { oneWayDistanceKm: Number.NaN, tripsPerWeek: 4 },
      { oneWayDistanceKm: 10, tripsPerWeek: 0 },
    ]) {
      const calc = calculateTransportImpact({
        id: 'test-bad',
        originalMode: 'car_petrol',
        alternativeMode: 'bus',
        ...badInput,
      });
      expect(calc.calculable).toBe(false);
      expect(calc.co2eAvoidedKgPerWeek).toBeNull();
      expect(calc.qualitativeFallback).toBeTruthy();
    }
  });

  it('warns against cycling exposure conflict during Severe AQI even though emissions are 0', () => {
    const calc = calculateTransportImpact({
      id: 'test-4',
      originalMode: 'car_petrol',
      alternativeMode: 'bicycle',
      oneWayDistanceKm: 10,
      tripsPerWeek: 4,
    });
    const exp = buildImpactExplanation(calc, SEVERE_AQI);
    expect(exp.personalExposureConsideration).toContain('Caution');
    expect(exp.personalExposureConsideration).toContain('not recommended');
    expect(exp.limitations.some((l) => l.includes('citywide AQI'))).toBe(true);
  });

  it('allows shaded-lane walking guidance when AQI is Good while keeping exposure nuanced', () => {
    const calc = calculateTransportImpact({
      id: 'test-5',
      originalMode: 'car_petrol',
      alternativeMode: 'walking',
      oneWayDistanceKm: 2,
      tripsPerWeek: 6,
    });
    const exp = buildImpactExplanation(calc, GOOD_AQI);
    expect(exp.personalExposureConsideration).toContain('traffic proximity');
    expect(exp.personalExposureConsideration).not.toContain('Caution:');
  });

  it('explains remote work and metro exposure nuance independently', () => {
    const remoteExp = buildImpactExplanation(
      calculateTransportImpact({
        id: 'r',
        originalMode: 'car_petrol',
        alternativeMode: 'remote',
        oneWayDistanceKm: 15,
        tripsPerWeek: 4,
      }),
      SEVERE_AQI,
    );
    expect(remoteExp.personalExposureConsideration).toContain('indoor environment is cleaner');

    const metroExp = buildImpactExplanation(
      calculateTransportImpact({
        id: 'm',
        originalMode: 'car_petrol',
        alternativeMode: 'metro',
        oneWayDistanceKm: 15,
        tripsPerWeek: 4,
      }),
      SEVERE_AQI,
    );
    expect(metroExp.personalExposureConsideration).toContain('station platforms');
  });
});
