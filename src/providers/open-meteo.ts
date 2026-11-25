import type {
  AirQualityForecast,
  AirQualityReading,
  HourlyForecastPoint,
} from '../domain/air-quality/types.ts';
import { interpretIndiaNAQI } from '../engines/aqi-interpreter.ts';
import { extractPollutants, OpenMeteoResponseSchema, toIsoTimestamp } from './open-meteo-schema.ts';
import { ProviderError, type AirQualityProvider, type ProviderFetchParams } from './types.ts';

const OPEN_METEO_ENDPOINT = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const REQUEST_TIMEOUT_MS = 10000;

export class OpenMeteoAirQualityProvider implements AirQualityProvider {
  readonly id = 'open-meteo-aq';
  readonly name = 'Open-Meteo Air Quality (CAMS Model)';
  readonly sourceType = 'model_forecast' as const;
  readonly attribution = 'Air quality model data by Open-Meteo.com (CAMS / Copernicus)';

  private readonly fetcher?: typeof fetch;

  constructor(fetcher?: typeof fetch) {
    this.fetcher = fetcher;
  }

  async fetchCurrentAndForecast(params: ProviderFetchParams): Promise<{
    current: AirQualityReading;
    forecast: AirQualityForecast;
  }> {
    if (
      !Number.isFinite(params.latitude) ||
      !Number.isFinite(params.longitude) ||
      params.latitude < -90 ||
      params.latitude > 90 ||
      params.longitude < -180 ||
      params.longitude > 180
    ) {
      throw new ProviderError('unsupported_location', this.id, 'Invalid geographic coordinates.');
    }

    const url = new URL(OPEN_METEO_ENDPOINT);
    url.searchParams.set('latitude', params.latitude.toFixed(4));
    url.searchParams.set('longitude', params.longitude.toFixed(4));
    url.searchParams.set(
      'current',
      'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi',
    );
    url.searchParams.set(
      'hourly',
      'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
    );
    url.searchParams.set('forecast_days', '2');
    url.searchParams.set('timezone', 'auto');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    if (params.signal) {
      params.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    let response: Response;
    try {
      const fetchImpl = this.fetcher ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
      response = await fetchImpl(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ProviderError('timeout', this.id, 'Air quality forecast request timed out.');
      }
      throw new ProviderError(
        'network',
        this.id,
        'Unable to reach Open-Meteo Air Quality service.',
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status === 429) {
      throw new ProviderError('rate_limit', this.id, 'Air quality provider rate limit reached.');
    }
    if (!response.ok) {
      throw new ProviderError(
        'provider_unavailable',
        this.id,
        `Air quality provider returned HTTP ${response.status}.`,
      );
    }

    let rawJson: unknown;
    try {
      rawJson = await response.json();
    } catch {
      throw new ProviderError('invalid_response', this.id, 'Malformed JSON from air quality API.');
    }

    const parsed = OpenMeteoResponseSchema.safeParse(rawJson);
    if (!parsed.success || !parsed.data.current) {
      throw new ProviderError(
        'invalid_response',
        this.id,
        'Air quality API response failed schema validation.',
      );
    }

    const retrievalTime = new Date().toISOString();
    const currentData = parsed.data.current;
    const currentPollutants = extractPollutants({
      pm25: currentData.pm2_5,
      pm10: currentData.pm10,
      no2: currentData.nitrogen_dioxide,
      so2: currentData.sulphur_dioxide,
      coUgM3: currentData.carbon_monoxide,
      o3: currentData.ozone,
    });

    const qualityFlags: string[] = ['model_grid_11km', 'hourly_model_values_not_24h_station_avg'];
    if (currentPollutants.length < 6) {
      qualityFlags.push('partial_pollutant_coverage');
    }

    const current: AirQualityReading = {
      id: `om-${params.city.toLowerCase().replace(/\s+/g, '-')}-${currentData.time}`,
      locationName: params.locationName,
      city: params.city,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      sourceId: 'open-meteo-aq',
      sourceName: this.name,
      sourceType: 'model_forecast',
      spatialResolutionNote:
        'CAMS atmospheric model grid (~11 km resolution); reflects regional model estimate, not a street-level sensor.',
      observationTime: toIsoTimestamp(currentData.time),
      retrievalTime,
      pollutants: currentPollutants,
      reportedAqi:
        typeof currentData.european_aqi === 'number' ? currentData.european_aqi : undefined,
      reportedAqiStandard:
        typeof currentData.european_aqi === 'number' ? 'EUROPEAN_EAQI' : undefined,
      forecastVsObserved: 'forecast',
      qualityFlags,
    };

    const hourlyData = parsed.data.hourly;
    const hourlyPoints: HourlyForecastPoint[] = [];
    if (hourlyData) {
      const limit = Math.min(hourlyData.time.length, 36);
      for (let i = 0; i < limit; i++) {
        const ts = hourlyData.time[i];
        if (!ts) continue;
        const pollutants = extractPollutants({
          pm25: hourlyData.pm2_5?.[i],
          pm10: hourlyData.pm10?.[i],
          no2: hourlyData.nitrogen_dioxide?.[i],
          so2: hourlyData.sulphur_dioxide?.[i],
          coUgM3: hourlyData.carbon_monoxide?.[i],
          o3: hourlyData.ozone?.[i],
        });
        const aqi = interpretIndiaNAQI(pollutants);
        hourlyPoints.push({
          timestamp: toIsoTimestamp(ts),
          pollutants,
          estimatedIndiaNaqi: aqi.value,
          estimatedCategory: aqi.category,
          dominantPollutant: aqi.dominantPollutant,
        });
      }
    }

    const forecast: AirQualityForecast = {
      locationName: params.locationName,
      city: params.city,
      sourceId: 'open-meteo-aq',
      sourceName: this.name,
      sourceType: 'model_forecast',
      spatialResolutionNote:
        'Hourly CAMS model forecast (~11 km grid). Actual street-level peaks may differ near traffic or local burning.',
      retrievalTime,
      hourly: hourlyPoints,
    };

    return { current, forecast };
  }
}
