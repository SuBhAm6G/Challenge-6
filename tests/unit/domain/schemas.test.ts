import { describe, expect, it } from 'vitest';
import { AiChatRequestSchema, AiChatResponseSchema } from '../../../src/ai/schemas.ts';
import {
  AirQualityReadingSchema,
  AQIStandardSchema,
  FreshnessStatusSchema,
  IndiaAQICategorySchema,
  PollutantIdSchema,
  PollutantReadingSchema,
} from '../../../src/domain/air-quality/types.ts';
import { AlertPreferencesSchema, AlertTypeSchema } from '../../../src/domain/alerts/types.ts';
import { CommunityActionSchema, CommunityPlanSchema } from '../../../src/domain/community/types.ts';
import {
  HouseholdProfileSchema,
  LocationPresetSchema,
} from '../../../src/domain/household/types.ts';
import {
  CompletedImpactEntrySchema,
  EmissionFactorSchema,
} from '../../../src/domain/impact/types.ts';
import {
  CookingFuelSchema,
  IndoorActionCategorySchema,
  IndoorProfileSchema,
} from '../../../src/domain/indoor/types.ts';
import {
  EffortLevelSchema,
  RecommendationStatusSchema,
  RoutineRecommendationSchema,
} from '../../../src/domain/routine/types.ts';
import { INDIA_EMISSION_FACTORS } from '../../../src/data/emission-factors.ts';
import {
  DEFAULT_ALERT_PREFERENCES,
  DEFAULT_COMMUNITY_PLAN,
  DEFAULT_DEMO_HOUSEHOLD,
  DEFAULT_DEMO_LOCATION,
  DEFAULT_INDOOR_PROFILE,
} from '../../../src/store/defaults.ts';

describe('Domain Zod Boundary Schemas', () => {
  it('validates pollutant IDs, India NAQI categories, standards, and freshness enums', () => {
    expect(PollutantIdSchema.options).toEqual(['pm25', 'pm10', 'no2', 'so2', 'co', 'o3']);
    expect(IndiaAQICategorySchema.options).toHaveLength(6);
    expect(AQIStandardSchema.options).toContain('INDIA_NAQI');
    expect(FreshnessStatusSchema.options).toContain('last_known');
  });

  it('rejects negative pollutant concentrations in PollutantReadingSchema', () => {
    expect(
      PollutantReadingSchema.safeParse({
        pollutant: 'pm25',
        concentration: -1,
        unit: 'µg/m³',
        averagingPeriod: '24h',
      }).success,
    ).toBe(false);

    expect(
      PollutantReadingSchema.safeParse({
        pollutant: 'pm25',
        concentration: 42.5,
        unit: 'µg/m³',
        averagingPeriod: '24h',
      }).success,
    ).toBe(true);
  });

  it('validates AirQualityReadingSchema bounds (latitude/longitude/pollutants)', () => {
    const valid = {
      id: 'read-1',
      locationName: 'New Delhi',
      city: 'New Delhi',
      latitude: 28.6139,
      longitude: 77.209,
      sourceId: 'open-meteo-aq',
      sourceName: 'Open-Meteo',
      sourceType: 'model_forecast',
      spatialResolutionNote: '~11 km grid',
      observationTime: '2026-11-25T10:00:00.000Z',
      retrievalTime: '2026-11-25T10:05:00.000Z',
      pollutants: [],
      forecastVsObserved: 'forecast',
      qualityFlags: [],
    };
    expect(AirQualityReadingSchema.safeParse(valid).success).toBe(true);
    expect(AirQualityReadingSchema.safeParse({ ...valid, latitude: 95 }).success).toBe(false);
    expect(AirQualityReadingSchema.safeParse({ ...valid, longitude: -185 }).success).toBe(false);
  });

  it('validates HouseholdProfileSchema and LocationPresetSchema defaults and constraints', () => {
    expect(LocationPresetSchema.safeParse(DEFAULT_DEMO_LOCATION).success).toBe(true);
    expect(HouseholdProfileSchema.safeParse(DEFAULT_DEMO_HOUSEHOLD).success).toBe(true);
    expect(
      HouseholdProfileSchema.safeParse({ ...DEFAULT_DEMO_HOUSEHOLD, memberCount: 0 }).success,
    ).toBe(false);
    expect(
      HouseholdProfileSchema.safeParse({ ...DEFAULT_DEMO_HOUSEHOLD, memberCount: 25 }).success,
    ).toBe(false);
    expect(
      HouseholdProfileSchema.safeParse({
        ...DEFAULT_DEMO_HOUSEHOLD,
        commuteDistanceKmOneWay: 250,
      }).success,
    ).toBe(false);
  });

  it('validates IndoorProfileSchema, CookingFuelSchema, and IndoorActionCategorySchema', () => {
    expect(IndoorProfileSchema.safeParse(DEFAULT_INDOOR_PROFILE).success).toBe(true);
    expect(CookingFuelSchema.options).toContain('electric_induction');
    expect(IndoorActionCategorySchema.options).toContain('source_control');
    expect(
      IndoorProfileSchema.safeParse({ ...DEFAULT_INDOOR_PROFILE, purifierCadrM3h: 5000 }).success,
    ).toBe(false);
  });

  it('validates RoutineRecommendationSchema, EffortLevelSchema, and RecommendationStatusSchema', () => {
    expect(EffortLevelSchema.options).toEqual([
      'no_cost',
      'low_effort',
      'moderate_effort',
      'planned',
    ]);
    expect(RecommendationStatusSchema.options).toContain('completed');
    expect(
      RoutineRecommendationSchema.safeParse({
        id: 'rec-1',
        period: 'morning',
        title: 'Move inside',
        description: 'High AQI',
        suggestedTiming: '07:00 AM',
        relevantContext: 'Severe',
        reason: 'Morning inversion',
        exposureEffect: 'Avoids strenuous intake',
        environmentalImpact: 'Neutral',
        effort: 'no_cost',
        confidence: 'high',
        evidenceIds: ['cpcb-naqi'],
        caveats: ['Indoor sources matter'],
        origin: 'deterministic',
        status: 'pending',
      }).success,
    ).toBe(true);
  });

  it('validates EmissionFactorSchema against every registered factor and CompletedImpactEntrySchema', () => {
    for (const factor of INDIA_EMISSION_FACTORS) {
      expect(EmissionFactorSchema.safeParse(factor).success).toBe(true);
    }
    expect(
      CompletedImpactEntrySchema.safeParse({
        id: 'imp-1',
        dateIso: '2026-11-25T10:00:00.000Z',
        impactType: 'transport_emissions',
        title: 'Car to Metro',
        exposureNote: 'Separate from CO2e',
        co2eAvoidedKg: 5.2,
        vehicleTripsAvoided: 4,
        confidence: 'moderate',
      }).success,
    ).toBe(true);
  });

  it('validates AlertPreferencesSchema, AlertTypeSchema, CommunityPlanSchema, and CommunityActionSchema', () => {
    expect(AlertTypeSchema.options).toContain('forecast_spike_ahead');
    expect(AlertPreferencesSchema.safeParse(DEFAULT_ALERT_PREFERENCES).success).toBe(true);
    expect(CommunityPlanSchema.safeParse(DEFAULT_COMMUNITY_PLAN).success).toBe(true);
    expect(
      CommunityActionSchema.safeParse({
        id: 'c1',
        title: '',
        responsibleRole: 'Lead',
        suggestedDeadline: 'Today',
        status: 'planned',
        effort: 'low',
        explanation: 'Test',
      }).success,
    ).toBe(false);
  });

  it('enforces AiChatRequestSchema and AiChatResponseSchema bounds against oversized or malformed payloads', () => {
    expect(AiChatRequestSchema.safeParse({ question: 'hi', context: {} }).success).toBe(false);
    expect(
      AiChatResponseSchema.safeParse({
        summary: 'Short valid summary',
        recommendations: [],
        dataLimitations: [],
        sourceIdsUsed: ['cpcb-naqi'],
        disclaimer: 'Environmental planning guidance only.',
      }).success,
    ).toBe(true);
    expect(
      AiChatResponseSchema.safeParse({
        summary: '',
        recommendations: [],
        dataLimitations: [],
        sourceIdsUsed: [],
        disclaimer: 'Valid',
      }).success,
    ).toBe(false);
  });
});
