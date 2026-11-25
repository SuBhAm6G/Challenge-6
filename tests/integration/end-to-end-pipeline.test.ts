import { describe, expect, it } from 'vitest';
import { buildAiContextPackage } from '../../src/ai/context-builder.ts';
import { DEFAULT_DEMO_HOUSEHOLD, DEFAULT_DEMO_LOCATION } from '../../src/data/cities.ts';
import { evaluateCleanAirAlerts } from '../../src/engines/alert-engine.ts';
import { interpretIndiaNAQI } from '../../src/engines/aqi-interpreter.ts';
import { evaluateReadingFreshness } from '../../src/engines/freshness.ts';
import {
  buildImpactExplanation,
  calculateTransportImpact,
} from '../../src/engines/impact-engine.ts';
import {
  evaluateVentilationGuidance,
  generateIndoorActions,
} from '../../src/engines/indoor-engine.ts';
import { generateDailyRoutine } from '../../src/engines/routine-engine.ts';
import { OpenMeteoAirQualityProvider } from '../../src/providers/open-meteo.ts';
import { resetDbHandleForTests } from '../../src/storage/db.ts';
import { LocalStorageRepo } from '../../src/storage/repositories.ts';
import { DEFAULT_ALERT_PREFERENCES, DEFAULT_INDOOR_PROFILE } from '../../src/store/defaults.ts';

describe('End-to-End Deterministic Intelligence Pipeline (Locate → Assess → Plan → Measure)', () => {
  it('processes live Open-Meteo payload through all deterministic engines and IndexedDB persistence', async () => {
    resetDbHandleForTests();
    await LocalStorageRepo.clearAll();

    const mockFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          latitude: 28.6139,
          longitude: 77.209,
          current: {
            time: new Date().toISOString(),
            pm2_5: 225,
            pm10: 360,
            carbon_monoxide: 2200,
            nitrogen_dioxide: 84,
            sulphur_dioxide: 16,
            ozone: 40,
            european_aqi: 110,
          },
          hourly: {
            time: Array.from({ length: 12 }, (_, idx) => {
              const d = new Date();
              d.setHours(8 + idx, 0, 0, 0);
              return d.toISOString();
            }),
            pm2_5: [225, 210, 185, 160, 120, 95, 105, 140, 195, 240, 260, 250],
            pm10: [360, 330, 280, 240, 180, 150, 165, 220, 300, 355, 380, 370],
            carbon_monoxide: Array(12).fill(2000),
            nitrogen_dioxide: Array(12).fill(78),
            sulphur_dioxide: Array(12).fill(14),
            ozone: Array(12).fill(45),
          },
        }),
        { status: 200 },
      );

    const provider = new OpenMeteoAirQualityProvider(mockFetch);
    const { current, forecast } = await provider.fetchCurrentAndForecast({
      city: DEFAULT_DEMO_LOCATION.city,
      locationName: `${DEFAULT_DEMO_LOCATION.locality}, ${DEFAULT_DEMO_LOCATION.city}`,
      latitude: DEFAULT_DEMO_LOCATION.latitude,
      longitude: DEFAULT_DEMO_LOCATION.longitude,
    });

    // 1. Assess & Understand
    const aqiResult = interpretIndiaNAQI(current.pollutants);
    const freshness = evaluateReadingFreshness(current);
    expect(aqiResult.standard).toBe('INDIA_NAQI');
    expect(aqiResult.category).toBe('Very Poor');
    expect(freshness.status).toBe('forecast');

    // 2. Plan Routine & Indoor Actions
    const routine = generateDailyRoutine(DEFAULT_DEMO_HOUSEHOLD, aqiResult, forecast);
    const ventilation = evaluateVentilationGuidance(DEFAULT_INDOOR_PROFILE, aqiResult, forecast);
    const indoorActions = generateIndoorActions(DEFAULT_INDOOR_PROFILE, aqiResult);
    expect(routine.some((r) => r.id === 'rec-morning-indoor-swap')).toBe(true);
    expect(ventilation.status).toBe('close_and_minimize');
    expect(indoorActions.length).toBeGreaterThanOrEqual(5);

    // 3. Measure Separate Exposure vs Emissions Impact
    const calc = calculateTransportImpact({
      id: 'pipe-1',
      originalMode: DEFAULT_DEMO_HOUSEHOLD.primaryCommuteMode,
      alternativeMode: 'metro',
      oneWayDistanceKm: DEFAULT_DEMO_HOUSEHOLD.commuteDistanceKmOneWay,
      tripsPerWeek: 4,
    });
    const explanation = buildImpactExplanation(calc, aqiResult);
    expect(calc.co2eAvoidedKgPerWeek).toBeGreaterThan(0);
    expect(explanation.personalExposureConsideration).not.toEqual(
      explanation.estimatedEnvironmentalImpact,
    );

    // 4. Alert Evaluation & Privacy-Minimized AI Context
    const alerts = evaluateCleanAirAlerts({
      reading: current,
      aqiResult,
      previousCategory: 'Poor',
      forecast,
      preferences: DEFAULT_ALERT_PREFERENCES,
      hasAirPurifier: DEFAULT_INDOOR_PROFILE.hasAirPurifier,
    });
    expect(alerts.length).toBeGreaterThanOrEqual(1);

    const aiContext = buildAiContextPackage({
      location: DEFAULT_DEMO_LOCATION,
      reading: current,
      aqiResult,
      forecast,
      household: DEFAULT_DEMO_HOUSEHOLD,
      indoor: DEFAULT_INDOOR_PROFILE,
      deterministicRoutine: routine,
    });
    expect(aiContext.city).toBe('New Delhi');
    expect(JSON.stringify(aiContext)).not.toContain('Dwarka Sector 10');

    // 5. IndexedDB Round-trip Cache Persistence
    await LocalStorageRepo.saveCachedAq('loc:new-delhi', current, forecast);
    const cached = await LocalStorageRepo.loadCachedAq('loc:new-delhi');
    expect(cached.ok).toBe(true);
    expect(cached.data?.reading.id).toBe(current.id);
    expect(cached.data?.forecast.hourly.length).toBe(forecast.hourly.length);
  });
});
