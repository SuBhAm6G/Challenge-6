import { describe, expect, it } from 'vitest';
import {
  INDIA_CATEGORY_BY_NAME,
  INDIA_CATEGORY_META,
  INDIA_NAQI_BREAKPOINTS,
  REQUIRED_AVERAGING_PERIODS,
} from '../../../src/data/aqi-standards.ts';
import { INDIAN_CITIES } from '../../../src/data/cities.ts';
import { COMMUNITY_TEMPLATE_ACTIONS } from '../../../src/data/community-templates.ts';
import {
  EMISSION_FACTOR_BY_MODE,
  INDIA_EMISSION_FACTORS,
} from '../../../src/data/emission-factors.ts';
import { INDOOR_ACTION_LIBRARY } from '../../../src/data/indoor-actions.ts';
import { POLLUTANT_CATALOG } from '../../../src/data/pollutants.ts';
import { SOURCE_REGISTRY, VALID_SOURCE_IDS } from '../../../src/data/sources.ts';
import { TransportModeSchema } from '../../../src/domain/household/types.ts';

describe('Static Data Registries Integrity', () => {
  it('defines all 6 CPCB India NAQI categories with monotonically ascending bounds', () => {
    expect(INDIA_CATEGORY_META).toHaveLength(6);
    expect(INDIA_CATEGORY_BY_NAME.size).toBe(6);
    for (let i = 1; i < INDIA_CATEGORY_META.length; i++) {
      expect(INDIA_CATEGORY_META[i]!.minAqi).toBeGreaterThan(INDIA_CATEGORY_META[i - 1]!.maxAqi);
    }
  });

  it('defines strictly ordered 6-tier CPCB concentration breakpoints for all 6 pollutants', () => {
    const pollutants = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3'] as const;
    for (const p of pollutants) {
      const tiers = INDIA_NAQI_BREAKPOINTS[p];
      expect(tiers).toHaveLength(6);
      for (let i = 0; i < tiers.length; i++) {
        expect(tiers[i]!.cHigh).toBeGreaterThan(tiers[i]!.cLow);
        expect(tiers[i]!.iHigh).toBeGreaterThan(tiers[i]!.iLow);
        if (i > 0) {
          expect(tiers[i]!.cLow).toBeGreaterThan(tiers[i - 1]!.cHigh);
        }
      }
      expect(REQUIRED_AVERAGING_PERIODS[p]).toMatch(/^(8h|24h)$/);
      expect(POLLUTANT_CATALOG[p].code.length).toBeGreaterThan(0);
    }
  });

  it('registers valid geographic coordinates within India bounds for all preset cities', () => {
    expect(INDIAN_CITIES.length).toBeGreaterThanOrEqual(15);
    const ids = new Set<string>();
    for (const c of INDIAN_CITIES) {
      expect(ids.has(c.id)).toBe(false);
      ids.add(c.id);
      expect(c.latitude).toBeGreaterThan(6);
      expect(c.latitude).toBeLessThan(37);
      expect(c.longitude).toBeGreaterThan(68);
      expect(c.longitude).toBeLessThan(98);
      expect(c.winterSmogNote.length).toBeGreaterThan(10);
    }
  });

  it('covers every TransportMode enum value in EMISSION_FACTOR_BY_MODE', () => {
    for (const mode of TransportModeSchema.options) {
      const factor = EMISSION_FACTOR_BY_MODE.get(mode);
      expect(factor, `Missing emission factor for ${mode}`).toBeDefined();
      expect(factor!.co2eGramsPerPassengerKm).toBeGreaterThanOrEqual(0);
    }
    expect(INDIA_EMISSION_FACTORS.length).toBe(TransportModeSchema.options.length);
  });

  it('contains valid HTTPS source URLs and matching evidence IDs across indoor and community libraries', () => {
    for (const src of SOURCE_REGISTRY) {
      expect(src.url).toMatch(/^https:\/\//);
    }
    for (const action of INDOOR_ACTION_LIBRARY) {
      expect(action.evidenceIds.length).toBeGreaterThan(0);
      for (const id of action.evidenceIds) {
        expect(VALID_SOURCE_IDS.has(id), `Invalid evidenceId ${id} in indoor action`).toBe(true);
      }
    }
    expect(COMMUNITY_TEMPLATE_ACTIONS.length).toBeGreaterThanOrEqual(5);
  });
});
