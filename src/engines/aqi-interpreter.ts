import { INDIA_NAQI_BREAKPOINTS, REQUIRED_AVERAGING_PERIODS } from '../data/aqi-standards.ts';
import type {
  AQIResult,
  AQIStandard,
  IndiaAQICategory,
  PollutantId,
  PollutantReading,
  PollutantSubIndex,
} from '../domain/air-quality/types.ts';

function categoryFromScore(score: number): IndiaAQICategory {
  if (score <= 50) return 'Good';
  if (score <= 100) return 'Satisfactory';
  if (score <= 200) return 'Moderate';
  if (score <= 300) return 'Poor';
  if (score <= 400) return 'Very Poor';
  return 'Severe';
}

function normalizeConcentrationUnit(reading: PollutantReading): number | null {
  if (!Number.isFinite(reading.concentration) || reading.concentration < 0) {
    return null;
  }
  if (reading.pollutant === 'co') {
    return reading.unit === 'µg/m³' ? reading.concentration / 1000 : reading.concentration;
  }
  return reading.unit === 'mg/m³' ? reading.concentration * 1000 : reading.concentration;
}

export function computePollutantSubIndex(
  pollutant: PollutantId,
  concentration: number,
): { subIndex: number; category: IndiaAQICategory; cappedAbove500: boolean } | null {
  if (!Number.isFinite(concentration) || concentration < 0) {
    return null;
  }

  const table = INDIA_NAQI_BREAKPOINTS[pollutant];
  if (!table || table.length === 0) return null;
  const lastBracket = table[table.length - 1];
  if (!lastBracket) return null;

  if (concentration > lastBracket.cHigh) {
    // Above 500 breakpoint: continue linear slope from the Severe bracket or cap transparently at 500+
    const extra =
      ((lastBracket.iHigh - lastBracket.iLow) / (lastBracket.cHigh - lastBracket.cLow)) *
        (concentration - lastBracket.cLow) +
      lastBracket.iLow;
    const rounded = Math.round(extra);
    return {
      subIndex: rounded,
      category: 'Severe',
      cappedAbove500: true,
    };
  }

  for (const bp of table) {
    if (concentration <= bp.cHigh) {
      const effectiveCLow = bp.cLow === 0 ? 0 : Math.floor(bp.cLow);
      const denominator = bp.cHigh - effectiveCLow;
      if (denominator <= 0) continue;
      const raw = ((bp.iHigh - bp.iLow) / denominator) * (concentration - effectiveCLow) + bp.iLow;
      const clamped = Math.max(bp.iLow, Math.min(bp.iHigh, Math.round(raw)));
      return {
        subIndex: clamped,
        category: bp.category,
        cappedAbove500: false,
      };
    }
  }

  return null;
}

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
    if (periodMismatch) {
      hasAveragingMismatch = true;
    }

    const computed = computePollutantSubIndex(reading.pollutant, normalized);
    if (!computed) continue;
    if (computed.cappedAbove500) {
      hasAbove500 = true;
    }

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
  const hasParticulate = seenPollutants.has('pm25') || seenPollutants.has('pm10');
  const minimumCoverageMet = coverageCount >= 3 && hasParticulate;

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

  if (subIndices.length === 0) {
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

  const sorted = [...subIndices].sort((a, b) => b.subIndex - a.subIndex);
  const top = sorted[0];
  if (!top) {
    return {
      value: null,
      category: null,
      standard: 'INDIA_NAQI',
      dominantPollutant: null,
      subIndices,
      coverageCount,
      minimumCoverageMet,
      limitations,
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
