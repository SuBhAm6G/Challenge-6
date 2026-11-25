import type {
  AirQualityForecast,
  AirQualityReading,
  SourceType,
} from '../domain/air-quality/types.ts';

export type ProviderErrorCode =
  | 'timeout'
  | 'network'
  | 'rate_limit'
  | 'invalid_response'
  | 'unsupported_location'
  | 'provider_unavailable';

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly providerId: string;

  constructor(code: ProviderErrorCode, providerId: string, message: string) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.providerId = providerId;
  }
}

export interface ProviderFetchParams {
  city: string;
  locationName: string;
  latitude: number;
  longitude: number;
  signal?: AbortSignal;
}

export interface AirQualityProvider {
  readonly id: string;
  readonly name: string;
  readonly sourceType: SourceType;
  readonly attribution: string;
  fetchCurrentAndForecast(params: ProviderFetchParams): Promise<{
    current: AirQualityReading;
    forecast: AirQualityForecast;
  }>;
}
