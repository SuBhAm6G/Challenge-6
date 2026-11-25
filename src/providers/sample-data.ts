import type {
  AirQualityForecast,
  AirQualityReading,
  HourlyForecastPoint,
  PollutantReading,
} from '../domain/air-quality/types.ts';
import { interpretIndiaNAQI } from '../engines/aqi-interpreter.ts';

/**
 * Generates an explicitly labeled synthetic winter-smog dataset for Demo Mode ONLY.
 * Never used as a substitute for live provider failures.
 */
export function buildSampleWinterSmogBundle(
  city = 'New Delhi',
  locationName = 'Dwarka Sector 10, New Delhi (Sample Demo)',
  latitude = 28.5921,
  longitude = 77.046,
): { current: AirQualityReading; forecast: AirQualityForecast } {
  const now = new Date();
  const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
  const retrievalTime = now.toISOString();

  const currentPollutants: PollutantReading[] = [
    { pollutant: 'pm25', concentration: 218, unit: 'µg/m³', averagingPeriod: '24h' },
    { pollutant: 'pm10', concentration: 342, unit: 'µg/m³', averagingPeriod: '24h' },
    { pollutant: 'no2', concentration: 86, unit: 'µg/m³', averagingPeriod: '24h' },
    { pollutant: 'so2', concentration: 18, unit: 'µg/m³', averagingPeriod: '24h' },
    { pollutant: 'co', concentration: 2.1, unit: 'mg/m³', averagingPeriod: '8h' },
    { pollutant: 'o3', concentration: 44, unit: 'µg/m³', averagingPeriod: '8h' },
  ];

  const current: AirQualityReading = {
    id: `sample-${city.toLowerCase().replace(/\s+/g, '-')}-winter-smog`,
    locationName,
    city,
    latitude,
    longitude,
    sourceId: 'sample-demo',
    sourceName: 'Synthetic Winter Smog Scenario (Demo Data — Not Live)',
    sourceType: 'sample_data',
    spatialResolutionNote:
      'Synthetic demonstration profile illustrating a severe North Indian winter smog day.',
    observationTime: now.toISOString(),
    retrievalTime,
    pollutants: currentPollutants,
    forecastVsObserved: 'sample',
    qualityFlags: ['synthetic_demo_data'],
  };

  // Realistic diurnal winter smog profile: morning inversion peak, modest midday dip (13-16h), evening buildup
  const hourlyMultipliers = [
    1.15, 1.2, 1.18, 1.1, 1.0, 0.9, 0.72, 0.58, 0.54, 0.56, 0.65, 0.78, 0.95, 1.1, 1.22, 1.28, 1.3,
    1.26, 1.2, 1.16, 1.12, 1.1, 1.08, 1.12,
  ];

  const hourly: HourlyForecastPoint[] = hourlyMultipliers.map((mult, idx) => {
    const slotTime = new Date(baseDate.getTime() + idx * 3600 * 1000);
    const pollutants: PollutantReading[] = [
      {
        pollutant: 'pm25',
        concentration: Math.round(210 * mult),
        unit: 'µg/m³',
        averagingPeriod: '1h',
      },
      {
        pollutant: 'pm10',
        concentration: Math.round(330 * mult),
        unit: 'µg/m³',
        averagingPeriod: '1h',
      },
      {
        pollutant: 'no2',
        concentration: Math.round(80 * mult),
        unit: 'µg/m³',
        averagingPeriod: '1h',
      },
      {
        pollutant: 'so2',
        concentration: Math.round(16 * mult),
        unit: 'µg/m³',
        averagingPeriod: '1h',
      },
      {
        pollutant: 'co',
        concentration: Math.round(2.0 * mult * 10) / 10,
        unit: 'mg/m³',
        averagingPeriod: '1h',
      },
      {
        pollutant: 'o3',
        concentration: Math.round(45 * (mult < 0.7 ? 1.4 : 0.8)),
        unit: 'µg/m³',
        averagingPeriod: '1h',
      },
    ];
    const interpreted = interpretIndiaNAQI(pollutants);
    return {
      timestamp: slotTime.toISOString(),
      pollutants,
      estimatedIndiaNaqi: interpreted.value,
      estimatedCategory: interpreted.category,
      dominantPollutant: interpreted.dominantPollutant,
    };
  });

  const forecast: AirQualityForecast = {
    locationName,
    city,
    sourceId: 'sample-demo',
    sourceName: 'Synthetic Winter Smog Scenario (Demo Data — Not Live)',
    sourceType: 'sample_data',
    spatialResolutionNote: 'Synthetic 24-hour winter diurnal curve for offline/evaluator demo.',
    retrievalTime,
    hourly,
  };

  return { current, forecast };
}
