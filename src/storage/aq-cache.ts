import {
  AirQualityForecastSchema,
  AirQualityReadingSchema,
  type AirQualityForecast,
  type AirQualityReading,
} from '../domain/air-quality/types.ts';
import { getSaansathiDb, type StorageResult } from './db.ts';

/**
 * Persists a validated air-quality reading and hourly forecast bundle in IndexedDB.
 */
export async function writeCachedAirQuality(
  locationKey: string,
  reading: AirQualityReading,
  forecast: AirQualityForecast,
): Promise<StorageResult<void>> {
  const rCheck = AirQualityReadingSchema.safeParse(reading);
  const fCheck = AirQualityForecastSchema.safeParse(forecast);
  if (!rCheck.success || !fCheck.success) {
    return { ok: false, errorCode: 'corrupted', message: 'Invalid air quality cache payload.' };
  }
  try {
    const db = await getSaansathiDb();
    await db.put('aqCache', {
      locationKey,
      reading: rCheck.data,
      forecast: fCheck.data,
      cachedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return {
        ok: false,
        errorCode: 'quota_exceeded',
        message: 'Storage quota exceeded while caching air quality reading.',
      };
    }
    return {
      ok: false,
      errorCode: 'unavailable',
      message: err instanceof Error ? err.message : 'Unable to cache reading locally.',
    };
  }
}

/**
 * Reads and Zod-validates cached air-quality readings for offline resilience.
 */
export async function readCachedAirQuality(locationKey: string): Promise<
  StorageResult<{
    reading: AirQualityReading;
    forecast: AirQualityForecast;
  } | null>
> {
  try {
    const db = await getSaansathiDb();
    const raw = await db.get('aqCache', locationKey);
    if (!raw) return { ok: true, data: null };
    const rCheck = AirQualityReadingSchema.safeParse(raw.reading);
    const fCheck = AirQualityForecastSchema.safeParse(raw.forecast);
    if (!rCheck.success || !fCheck.success) {
      return { ok: false, errorCode: 'corrupted', message: 'Cached reading was corrupted.' };
    }
    return { ok: true, data: { reading: rCheck.data, forecast: fCheck.data } };
  } catch (err) {
    return {
      ok: false,
      errorCode: 'unavailable',
      message: err instanceof Error ? err.message : 'IndexedDB read failed.',
    };
  }
}
