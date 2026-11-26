import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { z } from 'zod';
import { type AirQualityForecast, type AirQualityReading } from '../domain/air-quality/types.ts';
import { AlertPreferencesSchema } from '../domain/alerts/types.ts';
import { CommunityPlanSchema } from '../domain/community/types.ts';
import { HouseholdProfileSchema, LocationPresetSchema } from '../domain/household/types.ts';
import { CompletedImpactEntrySchema } from '../domain/impact/types.ts';
import { IndoorProfileSchema } from '../domain/indoor/types.ts';
import { RecommendationStatusSchema } from '../domain/routine/types.ts';

export const SAANSATHI_DB_NAME = 'saansathi-local-db';
export const SAANSATHI_DB_VERSION = 1;

const KeyValueRecordSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  updatedAt: z.string(),
});

interface SaansathiSchema extends DBSchema {
  appState: {
    key: string;
    value: {
      key: string;
      value: unknown;
      updatedAt: string;
    };
  };
  aqCache: {
    key: string;
    value: {
      locationKey: string;
      reading: AirQualityReading;
      forecast: AirQualityForecast;
      cachedAt: string;
    };
  };
}

export interface StorageResult<T> {
  ok: boolean;
  data?: T;
  errorCode?: 'quota_exceeded' | 'corrupted' | 'unavailable';
  message?: string;
}

let dbPromise: Promise<IDBPDatabase<SaansathiSchema>> | null = null;

/**
 * Opens (or reuses) the local `saansathi-local-db` IndexedDB connection.
 */
export async function getSaansathiDb(): Promise<IDBPDatabase<SaansathiSchema>> {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is unavailable in this environment');
  }
  if (!dbPromise) {
    dbPromise = openDB<SaansathiSchema>(SAANSATHI_DB_NAME, SAANSATHI_DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('appState')) {
            db.createObjectStore('appState', { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains('aqCache')) {
            db.createObjectStore('aqCache', { keyPath: 'locationKey' });
          }
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Resets the cached database promise for deterministic unit test isolation.
 */
export function resetDbHandleForTests(): void {
  dbPromise = null;
}

/**
 * Validates `value` against `schema` and persists it to the IndexedDB `appState` store.
 */
export async function writeValidatedRecord<T>(
  key: string,
  value: T,
  schema: z.ZodType<T>,
): Promise<StorageResult<T>> {
  const checked = schema.safeParse(value);
  if (!checked.success) {
    return {
      ok: false,
      errorCode: 'corrupted',
      message: `Validation refused write for key "${key}".`,
    };
  }

  try {
    const db = await getSaansathiDb();
    await db.put('appState', {
      key,
      value: checked.data,
      updatedAt: new Date().toISOString(),
    });
    return { ok: true, data: checked.data };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return {
        ok: false,
        errorCode: 'quota_exceeded',
        message: 'Local browser storage quota exceeded. Clear cached readings or export data.',
      };
    }
    return {
      ok: false,
      errorCode: 'unavailable',
      message: err instanceof Error ? err.message : 'Unable to write to local IndexedDB storage.',
    };
  }
}

/**
 * Reads and Zod-validates a stored record from `appState`, quarantining corrupted entries.
 */
export async function readValidatedRecord<T>(
  key: string,
  schema: z.ZodType<T>,
): Promise<StorageResult<T | null>> {
  try {
    const db = await getSaansathiDb();
    const raw = await db.get('appState', key);
    if (!raw) {
      return { ok: true, data: null };
    }
    const envelope = KeyValueRecordSchema.safeParse(raw);
    if (!envelope.success) {
      return { ok: false, errorCode: 'corrupted', message: `Corrupted envelope for "${key}".` };
    }
    const parsed = schema.safeParse(envelope.data.value);
    if (!parsed.success) {
      return {
        ok: false,
        errorCode: 'corrupted',
        message: `Stored record "${key}" failed schema validation and was safely ignored.`,
      };
    }
    return { ok: true, data: parsed.data };
  } catch (err) {
    return {
      ok: false,
      errorCode: 'unavailable',
      message: err instanceof Error ? err.message : 'Unable to read from IndexedDB.',
    };
  }
}

/**
 * Clears all local Saansathi IndexedDB object stores (`appState` and `aqCache`).
 */
export async function clearAllSaansathiStorage(): Promise<StorageResult<void>> {
  try {
    const db = await getSaansathiDb();
    await db.clear('appState');
    await db.clear('aqCache');
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      errorCode: 'unavailable',
      message: err instanceof Error ? err.message : 'Unable to clear local storage.',
    };
  }
}

export const StorageSchemas = {
  locationPresets: z.array(LocationPresetSchema),
  selectedLocationId: z.string().min(1),
  householdProfile: HouseholdProfileSchema,
  indoorProfile: IndoorProfileSchema,
  alertPreferences: AlertPreferencesSchema,
  routineStatuses: z.record(z.string(), RecommendationStatusSchema),
  completedIndoorActionIds: z.array(z.string()),
  impactHistory: z.array(CompletedImpactEntrySchema),
  communityPlan: CommunityPlanSchema,
} as const;
