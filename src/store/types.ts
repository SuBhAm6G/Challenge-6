import type {
  AirQualityForecast,
  AirQualityReading,
  AQIResult,
  IndiaAQICategory,
} from '../domain/air-quality/types.ts';
import type { AlertPreferences } from '../domain/alerts/types.ts';
import type { CommunityAction, CommunityPlan } from '../domain/community/types.ts';
import type { HouseholdProfile, LocationPreset } from '../domain/household/types.ts';
import type { CompletedImpactEntry } from '../domain/impact/types.ts';
import type { IndoorProfile } from '../domain/indoor/types.ts';
import type { RecommendationStatus } from '../domain/routine/types.ts';

export type AppRoute =
  'home' | 'routine' | 'indoor' | 'choices' | 'impact' | 'community' | 'assistant';

export type ProviderConnectionStatus =
  'idle' | 'loading' | 'ready' | 'unavailable' | 'rate_limited';
export type AiConnectionStatus = 'ready' | 'loading' | 'unavailable' | 'missing_key';
export type StorageSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AppStoreState {
  hydrated: boolean;
  activeRoute: AppRoute;
  isOnline: boolean;
  saveStatus: StorageSaveStatus;
  storageWarning: string | null;
  locationPresets: LocationPreset[];
  selectedLocationId: string;
  currentReading: AirQualityReading | null;
  forecast: AirQualityForecast | null;
  aqiResult: AQIResult;
  previousCategory: IndiaAQICategory | null;
  aqStatus: ProviderConnectionStatus;
  aqErrorMessage: string | null;
  isDemoMode: boolean;
  aiStatus: AiConnectionStatus;
  aiStatusDetail: string | null;
  householdProfile: HouseholdProfile;
  indoorProfile: IndoorProfile;
  alertPreferences: AlertPreferences;
  routineStatuses: Record<string, RecommendationStatus>;
  completedIndoorActionIds: string[];
  impactHistory: CompletedImpactEntry[];
  communityPlan: CommunityPlan;
  setRoute: (route: AppRoute) => void;
  setOnlineStatus: (online: boolean) => void;
  setAiStatus: (status: AiConnectionStatus, detail?: string | null) => void;
  hydrateFromStorage: () => Promise<void>;
  refreshAirQuality: (forceSample?: boolean) => Promise<void>;
  toggleDemoData: () => Promise<void>;
  selectLocation: (id: string) => Promise<void>;
  upsertLocationPreset: (preset: LocationPreset) => Promise<void>;
  deleteLocationPreset: (id: string) => Promise<void>;
  updateHouseholdProfile: (profile: HouseholdProfile) => Promise<void>;
  updateIndoorProfile: (profile: IndoorProfile) => Promise<void>;
  updateAlertPreferences: (prefs: AlertPreferences) => Promise<void>;
  setRoutineStatus: (recId: string, status: RecommendationStatus) => Promise<void>;
  toggleIndoorAction: (actionId: string) => Promise<void>;
  recordImpactEntry: (entry: CompletedImpactEntry) => Promise<void>;
  updateCommunityPlan: (plan: CommunityPlan) => Promise<void>;
  updateCommunityActionStatus: (
    actionId: string,
    status: CommunityAction['status'],
  ) => Promise<void>;
  addCommunityAction: (action: CommunityAction) => Promise<void>;
  resetAllLocalData: () => Promise<void>;
}
