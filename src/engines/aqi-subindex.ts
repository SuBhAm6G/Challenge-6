import { INDIA_NAQI_BREAKPOINTS } from '../data/aqi-standards.ts';
import type {
  IndiaAQICategory,
  PollutantId,
  PollutantReading,
} from '../domain/air-quality/types.ts';

/**
 * Maps a numeric India NAQI score to its official CPCB category band.
 */
export function categoryFromScore(score: number): IndiaAQICategory {
  if (score <= 50) return 'Good';
  if (score <= 100) return 'Satisfactory';
  if (score <= 200) return 'Moderate';
  if (score <= 300) return 'Poor';
  if (score <= 400) return 'Very Poor';
  return 'Severe';
}

/**
 * Normalizes pollutant units to CPCB breakpoint expectations (CO in mg/m³, others in µg/m³).
 */
export function normalizeConcentrationUnit(reading: PollutantReading): number | null {
  if (!Number.isFinite(reading.concentration) || reading.concentration < 0) {
    return null;
  }
  if (reading.pollutant === 'co') {
    return reading.unit === 'µg/m³' ? reading.concentration / 1000 : reading.concentration;
  }
  return reading.unit === 'mg/m³' ? reading.concentration * 1000 : reading.concentration;
}

/**
 * Computes the individual CPCB India NAQI sub-index for a single pollutant concentration.
 */
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
    const extra =
      ((lastBracket.iHigh - lastBracket.iLow) / (lastBracket.cHigh - lastBracket.cLow)) *
        (concentration - lastBracket.cLow) +
      lastBracket.iLow;
    return {
      subIndex: Math.round(extra),
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
      return {
        subIndex: Math.max(bp.iLow, Math.min(bp.iHigh, Math.round(raw))),
        category: bp.category,
        cappedAbove500: false,
      };
    }
  }

  return null;
}
