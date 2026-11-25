import type { AlertPreferences } from '../domain/alerts/types.ts';
import type { CommunityPlan } from '../domain/community/types.ts';
import type { HouseholdProfile, LocationPreset } from '../domain/household/types.ts';
import type { CompletedImpactEntry } from '../domain/impact/types.ts';
import type { IndoorProfile } from '../domain/indoor/types.ts';
import type { RecommendationStatus } from '../domain/routine/types.ts';
import {
  clearAllSaansathiStorage,
  readCachedAirQuality,
  readValidatedRecord,
  StorageSchemas,
  writeCachedAirQuality,
  writeValidatedRecord,
} from './db.ts';

export const STORAGE_KEYS = {
  locationPresets: 'locationPresets',
  selectedLocationId: 'selectedLocationId',
  householdProfile: 'householdProfile',
  indoorProfile: 'indoorProfile',
  alertPreferences: 'alertPreferences',
  routineStatuses: 'routineStatuses',
  completedIndoorActionIds: 'completedIndoorActionIds',
  impactHistory: 'impactHistory',
  communityPlan: 'communityPlan',
} as const;

export const LocalStorageRepo = {
  loadLocationPresets: () =>
    readValidatedRecord<LocationPreset[]>(
      STORAGE_KEYS.locationPresets,
      StorageSchemas.locationPresets,
    ),
  saveLocationPresets: (presets: LocationPreset[]) =>
    writeValidatedRecord(STORAGE_KEYS.locationPresets, presets, StorageSchemas.locationPresets),

  loadSelectedLocationId: () =>
    readValidatedRecord<string>(STORAGE_KEYS.selectedLocationId, StorageSchemas.selectedLocationId),
  saveSelectedLocationId: (id: string) =>
    writeValidatedRecord(STORAGE_KEYS.selectedLocationId, id, StorageSchemas.selectedLocationId),

  loadHouseholdProfile: () =>
    readValidatedRecord<HouseholdProfile>(
      STORAGE_KEYS.householdProfile,
      StorageSchemas.householdProfile,
    ),
  saveHouseholdProfile: (profile: HouseholdProfile) =>
    writeValidatedRecord(STORAGE_KEYS.householdProfile, profile, StorageSchemas.householdProfile),

  loadIndoorProfile: () =>
    readValidatedRecord<IndoorProfile>(STORAGE_KEYS.indoorProfile, StorageSchemas.indoorProfile),
  saveIndoorProfile: (profile: IndoorProfile) =>
    writeValidatedRecord(STORAGE_KEYS.indoorProfile, profile, StorageSchemas.indoorProfile),

  loadAlertPreferences: () =>
    readValidatedRecord<AlertPreferences>(
      STORAGE_KEYS.alertPreferences,
      StorageSchemas.alertPreferences,
    ),
  saveAlertPreferences: (prefs: AlertPreferences) =>
    writeValidatedRecord(STORAGE_KEYS.alertPreferences, prefs, StorageSchemas.alertPreferences),

  loadRoutineStatuses: () =>
    readValidatedRecord<Record<string, RecommendationStatus>>(
      STORAGE_KEYS.routineStatuses,
      StorageSchemas.routineStatuses,
    ),
  saveRoutineStatuses: (statuses: Record<string, RecommendationStatus>) =>
    writeValidatedRecord(STORAGE_KEYS.routineStatuses, statuses, StorageSchemas.routineStatuses),

  loadCompletedIndoorActionIds: () =>
    readValidatedRecord<string[]>(
      STORAGE_KEYS.completedIndoorActionIds,
      StorageSchemas.completedIndoorActionIds,
    ),
  saveCompletedIndoorActionIds: (ids: string[]) =>
    writeValidatedRecord(
      STORAGE_KEYS.completedIndoorActionIds,
      ids,
      StorageSchemas.completedIndoorActionIds,
    ),

  loadImpactHistory: () =>
    readValidatedRecord<CompletedImpactEntry[]>(
      STORAGE_KEYS.impactHistory,
      StorageSchemas.impactHistory,
    ),
  saveImpactHistory: (entries: CompletedImpactEntry[]) =>
    writeValidatedRecord(STORAGE_KEYS.impactHistory, entries, StorageSchemas.impactHistory),

  loadCommunityPlan: () =>
    readValidatedRecord<CommunityPlan>(STORAGE_KEYS.communityPlan, StorageSchemas.communityPlan),
  saveCommunityPlan: (plan: CommunityPlan) =>
    writeValidatedRecord(STORAGE_KEYS.communityPlan, plan, StorageSchemas.communityPlan),

  loadCachedAq: readCachedAirQuality,
  saveCachedAq: writeCachedAirQuality,
  clearAll: clearAllSaansathiStorage,
};
