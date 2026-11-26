import { REQUIRED_AVERAGING_PERIODS } from '../data/aqi-standards.ts';
import type {
  AQIResult,
  AQIStandard,
  PollutantId,
  PollutantReading,
  PollutantSubIndex,
} from '../domain/air-quality/types.ts';
import {
  categoryFromScore,
  computePollutantSubIndex,
  normalizeConcentrationUnit,
} from './aqi-subindex.ts';

export { computePollutantSubIndex };

/**
 * Interprets pollutant readings strictly under the CPCB India National AQI (NAQI).
 * Never silently substitutes US EPA or European AQI thresholds.
 */
export function interpretIndiaNAQI(
  readings: readonly PollutantReading[],
  standard: AQIStandard = 'INDIA_NAQI',
): AQIResult {
  if (standard !== 'INDIA_NAQI') {
    return {
      value: null,
      category: null,
      standard,
      dominantPollutant: null,
      subIndices: [],
      coverageCount: 0,
      minimumCoverageMet: false,
      limitations: [
        `Unsupported local index calculation for standard "${standard}". Saansathi only computes India NAQI locally and never substitutes another country's scale.`,
      ],
    };
  }

  const subIndices: PollutantSubIndex[] = [];
  const limitations: string[] = [];
  const seenPollutants = new Set<PollutantId>();
  let hasAveragingMismatch = false;
  let hasAbove500 = false;

  for (const reading of readings) {
    if (seenPollutants.has(reading.pollutant)) continue;
    const normalized = normalizeConcentrationUnit(reading);
    if (normalized === null) {
      limitations.push(`Ignored invalid measurement for ${reading.pollutant.toUpperCase()}.`);
      continue;
    }

    const expectedPeriod = REQUIRED_AVERAGING_PERIODS[reading.pollutant];
    const periodMismatch = reading.averagingPeriod !== expectedPeriod;
    if (periodMismatch) hasAveragingMismatch = true;

    const computed = computePollutantSubIndex(reading.pollutant, normalized);
    if (!computed) continue;
    if (computed.cappedAbove500) hasAbove500 = true;

    seenPollutants.add(reading.pollutant);
    subIndices.push({
      pollutant: reading.pollutant,
      concentration: reading.concentration,
      unit: reading.unit,
      subIndex: computed.subIndex,
      category: computed.category,
      averagingPeriodWarning: periodMismatch
        ? `Measured as ${reading.averagingPeriod} instead of CPCB ${expectedPeriod} average`
        : undefined,
    });
  }

  const coverageCount = subIndices.length;
  const minimumCoverageMet =
    coverageCount >= 3 && (seenPollutants.has('pm25') || seenPollutants.has('pm10'));

  if (!minimumCoverageMet) {
    limitations.push(
      'CPCB NAQI requires at least 3 pollutants including PM2.5 or PM10; value shown is an incomplete indicative estimate.',
    );
  }
  if (hasAveragingMismatch) {
    limitations.push(
      'Input uses hourly model concentrations rather than official 24-hour/8-hour station rolling averages.',
    );
  }
  if (hasAbove500) {
    limitations.push(
      'At least one pollutant exceeds the CPCB 500 breakpoint (extreme Severe range).',
    );
  }

  const sorted = [...subIndices].sort((a, b) => b.subIndex - a.subIndex);
  const top = sorted[0];
  if (!top) {
    return {
      value: null,
      category: null,
      standard: 'INDIA_NAQI',
      dominantPollutant: null,
      subIndices: [],
      coverageCount: 0,
      minimumCoverageMet: false,
      limitations: ['No valid pollutant readings available to compute India NAQI.'],
    };
  }

  return {
    value: top.subIndex,
    category: categoryFromScore(top.subIndex),
    standard: 'INDIA_NAQI',
    dominantPollutant: top.pollutant,
    subIndices: sorted,
    coverageCount,
    minimumCoverageMet,
    limitations,
  };
}
