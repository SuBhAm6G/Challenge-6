import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_DEMO_HOUSEHOLD, DEFAULT_DEMO_LOCATION } from '../../../src/data/cities.ts';
import { buildSampleWinterSmogBundle } from '../../../src/providers/sample-data.ts';
import {
  clearAllSaansathiStorage,
  getSaansathiDb,
  readValidatedRecord,
  resetDbHandleForTests,
  StorageSchemas,
  writeValidatedRecord,
} from '../../../src/storage/db.ts';
import { LocalStorageRepo } from '../../../src/storage/repositories.ts';
import {
  DEFAULT_ALERT_PREFERENCES,
  DEFAULT_COMMUNITY_PLAN,
  DEFAULT_INDOOR_PROFILE,
} from '../../../src/store/defaults.ts';

describe('IndexedDB Persistence & Validation', () => {
  beforeEach(async () => {
    resetDbHandleForTests();
    await clearAllSaansathiStorage();
  });

  it('round-trips household profile and cached air quality data cleanly', async () => {
    const saveRes = await LocalStorageRepo.saveHouseholdProfile(DEFAULT_DEMO_HOUSEHOLD);
    expect(saveRes.ok).toBe(true);

    const loadRes = await LocalStorageRepo.loadHouseholdProfile();
    expect(loadRes.ok).toBe(true);
    expect(loadRes.data?.name).toBe(DEFAULT_DEMO_HOUSEHOLD.name);

    const { current, forecast } = buildSampleWinterSmogBundle();
    const cacheRes = await LocalStorageRepo.saveCachedAq(
      'new delhi::28.59::77.05',
      current,
      forecast,
    );
    expect(cacheRes.ok).toBe(true);

    const readCache = await LocalStorageRepo.loadCachedAq('new delhi::28.59::77.05');
    expect(readCache.ok).toBe(true);
    expect(readCache.data?.reading.city).toBe('New Delhi');
  });

  it('round-trips location presets, indoor profile, alert prefs, and routine statuses', async () => {
    await LocalStorageRepo.saveLocationPresets([DEFAULT_DEMO_LOCATION]);
    await LocalStorageRepo.saveIndoorProfile({ ...DEFAULT_INDOOR_PROFILE, hasAirPurifier: true });
    await LocalStorageRepo.saveAlertPreferences({
      ...DEFAULT_ALERT_PREFERENCES,
      notifyOnCategoryAtOrAbove: 'Very Poor',
    });
    await LocalStorageRepo.saveRoutineStatuses({ 'rec-1': 'completed' });

    expect((await LocalStorageRepo.loadLocationPresets()).data).toHaveLength(1);
    expect((await LocalStorageRepo.loadIndoorProfile()).data?.hasAirPurifier).toBe(true);
    expect((await LocalStorageRepo.loadAlertPreferences()).data?.notifyOnCategoryAtOrAbove).toBe(
      'Very Poor',
    );
    expect((await LocalStorageRepo.loadRoutineStatuses()).data?.['rec-1']).toBe('completed');
  });

  it('round-trips completed indoor IDs, impact history, and community plan', async () => {
    await LocalStorageRepo.saveCompletedIndoorActionIds(['indoor-stop-burning']);
    await LocalStorageRepo.saveImpactHistory([
      {
        id: 'imp-1',
        dateIso: '2026-11-25T10:00:00.000Z',
        impactType: 'transport_emissions',
        title: 'Car to Metro',
        exposureNote: 'Separate',
        co2eAvoidedKg: 5.5,
        vehicleTripsAvoided: 4,
        confidence: 'moderate',
      },
    ]);
    await LocalStorageRepo.saveCommunityPlan(DEFAULT_COMMUNITY_PLAN);

    expect((await LocalStorageRepo.loadCompletedIndoorActionIds()).data).toEqual([
      'indoor-stop-burning',
    ]);
    expect((await LocalStorageRepo.loadImpactHistory()).data).toHaveLength(1);
    expect((await LocalStorageRepo.loadCommunityPlan()).data?.id).toBe(DEFAULT_COMMUNITY_PLAN.id);
  });

  it('returns null data cleanly when cached AQ or state records do not exist', async () => {
    const missingCache = await LocalStorageRepo.loadCachedAq('nonexistent-key');
    expect(missingCache.ok).toBe(true);
    expect(missingCache.data).toBeNull();
  });

  it('safely rejects corrupted records without crashing', async () => {
    const db = await getSaansathiDb();
    await db.put('appState', {
      key: 'householdProfile',
      value: { invalidField: 123 },
      updatedAt: new Date().toISOString(),
    });

    const loadRes = await readValidatedRecord('householdProfile', StorageSchemas.householdProfile);
    expect(loadRes.ok).toBe(false);
    expect(loadRes.errorCode).toBe('corrupted');
  });

  it('refuses to persist invalid payloads and supports full data deletion', async () => {
    const badWrite = await writeValidatedRecord(
      'selectedLocationId',
      '',
      StorageSchemas.selectedLocationId,
    );
    expect(badWrite.ok).toBe(false);

    await LocalStorageRepo.saveSelectedLocationId('loc-1');
    await LocalStorageRepo.clearAll();
    const afterClear = await LocalStorageRepo.loadSelectedLocationId();
    expect(afterClear.ok).toBe(true);
    expect(afterClear.data).toBeNull();
  });
});
