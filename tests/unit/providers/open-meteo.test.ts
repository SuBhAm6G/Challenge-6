import { describe, expect, it } from 'vitest';
import { interpretIndiaNAQI } from '../../../src/engines/aqi-interpreter.ts';
import { OpenMeteoAirQualityProvider } from '../../../src/providers/open-meteo.ts';
import { buildSampleWinterSmogBundle } from '../../../src/providers/sample-data.ts';
import { ProviderError } from '../../../src/providers/types.ts';

describe('Open-Meteo Air Quality Provider & Sample Data', () => {
  it('parses valid response, converts CO µg/m³ to mg/m³, and preserves model provenance', async () => {
    const mockFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          latitude: 28.625,
          longitude: 77.25,
          current: {
            time: '2026-11-25T12:00',
            pm2_5: 145.5,
            pm10: 210,
            carbon_monoxide: 1850,
            nitrogen_dioxide: null,
            sulphur_dioxide: 12,
            ozone: 40,
            european_aqi: 95,
          },
          hourly: {
            time: ['2026-11-25T12:00', '2026-11-25T13:00'],
            pm2_5: [145.5, 110],
            pm10: [210, 170],
            carbon_monoxide: [1850, 1400],
            nitrogen_dioxide: [55, 48],
            sulphur_dioxide: [12, 10],
            ozone: [40, 52],
          },
        }),
        { status: 200 },
      );

    const provider = new OpenMeteoAirQualityProvider(mockFetch);
    const { current, forecast } = await provider.fetchCurrentAndForecast({
      city: 'New Delhi',
      locationName: 'Central Delhi',
      latitude: 28.6139,
      longitude: 77.209,
    });

    expect(current.sourceType).toBe('model_forecast');
    expect(current.forecastVsObserved).toBe('forecast');
    expect(current.reportedAqiStandard).toBe('EUROPEAN_EAQI');
    expect(current.pollutants.some((p) => p.pollutant === 'no2')).toBe(false);
    expect(current.qualityFlags).toContain('partial_pollutant_coverage');
    const co = current.pollutants.find((p) => p.pollutant === 'co');
    expect(co?.concentration).toBe(1.85);
    expect(co?.unit).toBe('mg/m³');
    expect(forecast.hourly).toHaveLength(2);
  });

  it('rejects invalid coordinates before making a network call', async () => {
    const provider = new OpenMeteoAirQualityProvider();
    await expect(
      provider.fetchCurrentAndForecast({
        city: 'Nowhere',
        locationName: 'Invalid',
        latitude: 120,
        longitude: 77,
      }),
    ).rejects.toMatchObject({ code: 'unsupported_location' });
    await expect(
      provider.fetchCurrentAndForecast({
        city: 'Nowhere',
        locationName: 'Invalid',
        latitude: 28,
        longitude: -200,
      }),
    ).rejects.toMatchObject({ code: 'unsupported_location' });
  });

  it('throws typed ProviderError for rate limit, 5xx outage, malformed JSON, schema failure, and timeout', async () => {
    const reqParams = {
      city: 'Delhi',
      locationName: 'Delhi',
      latitude: 28.6,
      longitude: 77.2,
    };

    const rateLimitProvider = new OpenMeteoAirQualityProvider(
      async () => new Response('Too many requests', { status: 429 }),
    );
    await expect(rateLimitProvider.fetchCurrentAndForecast(reqParams)).rejects.toMatchObject({
      code: 'rate_limit',
    });

    const serverErrProvider = new OpenMeteoAirQualityProvider(
      async () => new Response('Bad gateway', { status: 502 }),
    );
    await expect(serverErrProvider.fetchCurrentAndForecast(reqParams)).rejects.toMatchObject({
      code: 'provider_unavailable',
    });

    const badJsonProvider = new OpenMeteoAirQualityProvider(
      async () => new Response('not-json', { status: 200 }),
    );
    await expect(badJsonProvider.fetchCurrentAndForecast(reqParams)).rejects.toMatchObject({
      code: 'invalid_response',
    });

    const missingCurrentProvider = new OpenMeteoAirQualityProvider(
      async () =>
        new Response(JSON.stringify({ latitude: 28.6, longitude: 77.2 }), { status: 200 }),
    );
    await expect(missingCurrentProvider.fetchCurrentAndForecast(reqParams)).rejects.toMatchObject({
      code: 'invalid_response',
    });

    const abortProvider = new OpenMeteoAirQualityProvider(async () => {
      throw new DOMException('Aborted', 'AbortError');
    });
    await expect(abortProvider.fetchCurrentAndForecast(reqParams)).rejects.toMatchObject({
      code: 'timeout',
    });

    const networkFailProvider = new OpenMeteoAirQualityProvider(async () => {
      throw new Error('ECONNREFUSED');
    });
    const err = await networkFailProvider
      .fetchCurrentAndForecast(reqParams)
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect((err as ProviderError).code).toBe('network');
  });

  it('generates explicitly labeled synthetic sample winter smog bundle with valid NAQI profile', () => {
    const { current, forecast } = buildSampleWinterSmogBundle('Lucknow', 'Gomti Nagar', 26.8, 80.9);
    expect(current.sourceType).toBe('sample_data');
    expect(current.forecastVsObserved).toBe('sample');
    expect(current.qualityFlags).toContain('synthetic_demo_data');
    expect(forecast.hourly).toHaveLength(24);
    const aqi = interpretIndiaNAQI(current.pollutants);
    expect(aqi.category).toBe('Very Poor');
    expect(aqi.minimumCoverageMet).toBe(true);
  });
});
