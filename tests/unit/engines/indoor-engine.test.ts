import { describe, expect, it } from 'vitest';
import type { AQIResult } from '../../../src/domain/air-quality/types.ts';
import {
  evaluateVentilationGuidance,
  generateIndoorActions,
} from '../../../src/engines/indoor-engine.ts';
import { buildSampleWinterSmogBundle } from '../../../src/providers/sample-data.ts';
import { DEFAULT_INDOOR_PROFILE } from '../../../src/store/defaults.ts';

const HIGH_AQI: AQIResult = {
  value: 340,
  category: 'Very Poor',
  standard: 'INDIA_NAQI',
  dominantPollutant: 'pm25',
  subIndices: [],
  coverageCount: 6,
  minimumCoverageMet: true,
  limitations: [],
};

const MODERATE_AQI: AQIResult = { ...HIGH_AQI, value: 155, category: 'Moderate' };
const GOOD_AQI: AQIResult = { ...HIGH_AQI, value: 45, category: 'Good', dominantPollutant: 'pm10' };
const UNAVAILABLE_AQI: AQIResult = {
  value: null,
  category: null,
  standard: 'INDIA_NAQI',
  dominantPollutant: null,
  subIndices: [],
  coverageCount: 0,
  minimumCoverageMet: false,
  limitations: [],
};

describe('Indoor Recommendation & Ventilation Engine', () => {
  it('never recommends ozone generators and explicitly warns against them', () => {
    const actions = generateIndoorActions(DEFAULT_INDOOR_PROFILE, HIGH_AQI);
    expect(actions.some((a) => a.title.toLowerCase().includes('use ozone'))).toBe(false);
    const mythGuard = actions.find((a) => a.id === 'indoor-no-ozone-myth');
    expect(mythGuard?.whatToDo).toContain('Avoid ozone generators');
  });

  it('includes combustion safety warning when gas or biomass cooking is used', () => {
    const { forecast } = buildSampleWinterSmogBundle();
    const guidance = evaluateVentilationGuidance(DEFAULT_INDOOR_PROFILE, HIGH_AQI, forecast);
    expect(guidance.status).toBe('close_and_minimize');
    expect(guidance.combustionSafetyWarning).toContain('Never seal kitchens');
    expect(guidance.recommendedWindowText).toBeDefined();
  });

  it('adapts combustion warning cleanly for electric induction households', () => {
    const guidance = evaluateVentilationGuidance(
      { ...DEFAULT_INDOOR_PROFILE, cookingFuel: 'electric_induction' },
      HIGH_AQI,
      null,
    );
    expect(guidance.combustionSafetyWarning).not.toContain('gas stoves');
    expect(guidance.combustionSafetyWarning).toContain('stuffy');
  });

  it('handles unavailable outdoor AQI with cautious kitchen ventilation rules', () => {
    const guidance = evaluateVentilationGuidance(DEFAULT_INDOOR_PROFILE, UNAVAILABLE_AQI, null);
    expect(guidance.status).toBe('uncertain');
    expect(guidance.headline).toContain('unavailable');
  });

  it('recommends selective midday airing during Moderate AQI', () => {
    const { forecast } = buildSampleWinterSmogBundle();
    const guidance = evaluateVentilationGuidance(DEFAULT_INDOOR_PROFILE, MODERATE_AQI, forecast);
    expect(guidance.status).toBe('selective_window');
    expect(guidance.recommendedWindowText).toContain('Best forecast window');
  });

  it('recommends cross-ventilation when outdoor AQI is Good', () => {
    const guidance = evaluateVentilationGuidance(DEFAULT_INDOOR_PROFILE, GOOD_AQI, null);
    expect(guidance.status).toBe('ventilate_now');
  });

  it('omits window suggestion in Severe/Very Poor AQI when windows cannot open safely', () => {
    const { forecast } = buildSampleWinterSmogBundle();
    const guidance = evaluateVentilationGuidance(
      { ...DEFAULT_INDOOR_PROFILE, canOpenWindowsSafely: false },
      HIGH_AQI,
      forecast,
    );
    expect(guidance.recommendedWindowText).toBeUndefined();
  });

  it('calculates rough CADR room-size context when purifier CADR is known', () => {
    const profileWithPurifier = {
      ...DEFAULT_INDOOR_PROFILE,
      hasAirPurifier: true,
      purifierCadrKnown: true,
      purifierCadrM3h: 360,
    };
    const actions = generateIndoorActions(profileWithPurifier, HIGH_AQI);
    const hepa = actions.find((a) => a.id === 'indoor-hepa-placement');
    expect(hepa?.whatToDo).toContain('360 m³/h CADR');
    expect(hepa?.priority).toBe('high');
  });

  it('shows True HEPA purchase guidance only for moderate/flexible budgets without purifier', () => {
    const lowBudget = generateIndoorActions(
      { ...DEFAULT_INDOOR_PROFILE, hasAirPurifier: false, budget: 'low' },
      HIGH_AQI,
    );
    expect(lowBudget.some((a) => a.id === 'indoor-hepa-placement')).toBe(false);

    const modBudget = generateIndoorActions(
      { ...DEFAULT_INDOOR_PROFILE, hasAirPurifier: false, budget: 'moderate' },
      HIGH_AQI,
    );
    expect(modBudget.find((a) => a.id === 'indoor-hepa-placement')?.title).toContain('True HEPA');
  });

  it('includes door gap sealing only when AQI > 150', () => {
    expect(
      generateIndoorActions(DEFAULT_INDOOR_PROFILE, GOOD_AQI).some(
        (a) => a.id === 'indoor-door-sealing',
      ),
    ).toBe(false);
    expect(
      generateIndoorActions(DEFAULT_INDOOR_PROFILE, HIGH_AQI).some(
        (a) => a.id === 'indoor-door-sealing',
      ),
    ).toBe(true);
  });
});
