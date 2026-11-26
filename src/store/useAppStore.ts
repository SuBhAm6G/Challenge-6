import { create } from 'zustand';
import { interpretIndiaNAQI } from '../engines/aqi-interpreter.ts';
import { LocalStorageRepo } from '../storage/repositories.ts';
import { createAqSlice } from './aqSlice.ts';
import {
  DEFAULT_ALERT_PREFERENCES,
  DEFAULT_COMMUNITY_PLAN,
  DEFAULT_DEMO_HOUSEHOLD,
  DEFAULT_DEMO_LOCATION,
  DEFAULT_INDOOR_PROFILE,
  EMPTY_AQI_RESULT,
  locationCacheKey,
} from './defaults.ts';
import { createPlanningSlice } from './planningSlice.ts';
import type { AppStoreState } from './types.ts';

export type {
  AiConnectionStatus,
  AppRoute,
  AppStoreState,
  ProviderConnectionStatus,
  StorageSaveStatus,
} from './types.ts';

/**
 * Global modular Zustand store combining air-quality state, planning persistence, and network status.
 */
export const useAppStore = create<AppStoreState>((set, get, api) => ({
  hydrated: false,
  activeRoute: 'home',
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  saveStatus: 'idle',
  storageWarning: null,
  aiStatus: 'ready',
  aiStatusDetail: null,

  ...createAqSlice(set, get, api),
  ...createPlanningSlice(set, get, api),

  setRoute: (route) => set({ activeRoute: route }),
  setOnlineStatus: (online) => set({ isOnline: online }),
  setAiStatus: (aiStatus, detail = null) => set({ aiStatus, aiStatusDetail: detail }),

  hydrateFromStorage: async () => {
    const [p, s, h, i, a, r, ind, imp, c] = await Promise.all([
      LocalStorageRepo.loadLocationPresets(),
      LocalStorageRepo.loadSelectedLocationId(),
      LocalStorageRepo.loadHouseholdProfile(),
      LocalStorageRepo.loadIndoorProfile(),
      LocalStorageRepo.loadAlertPreferences(),
      LocalStorageRepo.loadRoutineStatuses(),
      LocalStorageRepo.loadCompletedIndoorActionIds(),
      LocalStorageRepo.loadImpactHistory(),
      LocalStorageRepo.loadCommunityPlan(),
    ]);

    const presets = p.ok && p.data && p.data.length > 0 ? p.data : [DEFAULT_DEMO_LOCATION];
    const selectedId =
      s.ok && s.data && presets.some((x) => x.id === s.data)
        ? s.data
        : (presets[0]?.id ?? DEFAULT_DEMO_LOCATION.id);
    const activeLoc = presets.find((x) => x.id === selectedId) ?? DEFAULT_DEMO_LOCATION;
    const cachedAq = await LocalStorageRepo.loadCachedAq(locationCacheKey(activeLoc));
    const reading = cachedAq.ok && cachedAq.data ? cachedAq.data.reading : null;
    const forecast = cachedAq.ok && cachedAq.data ? cachedAq.data.forecast : null;

    set({
      hydrated: true,
      locationPresets: presets,
      selectedLocationId: selectedId,
      householdProfile: h.ok && h.data ? h.data : DEFAULT_DEMO_HOUSEHOLD,
      indoorProfile: i.ok && i.data ? i.data : DEFAULT_INDOOR_PROFILE,
      alertPreferences: a.ok && a.data ? a.data : DEFAULT_ALERT_PREFERENCES,
      routineStatuses: r.ok && r.data ? r.data : {},
      completedIndoorActionIds: ind.ok && ind.data ? ind.data : [],
      impactHistory: imp.ok && imp.data ? imp.data : [],
      communityPlan: c.ok && c.data ? c.data : DEFAULT_COMMUNITY_PLAN,
      currentReading: reading,
      forecast,
      aqiResult: reading ? interpretIndiaNAQI(reading.pollutants) : EMPTY_AQI_RESULT,
      isDemoMode: reading?.sourceType === 'sample_data',
    });

    await get().refreshAirQuality(false);
  },

  resetAllLocalData: async () => {
    const clearRes = await LocalStorageRepo.clearAll();
    try {
      window.localStorage.removeItem('saansathi_location_prompted');
    } catch (err) {
      // localStorage may be restricted in private browsing or test sandboxes
      void err;
    }
    set({
      locationPresets: [DEFAULT_DEMO_LOCATION],
      selectedLocationId: DEFAULT_DEMO_LOCATION.id,
      householdProfile: DEFAULT_DEMO_HOUSEHOLD,
      indoorProfile: DEFAULT_INDOOR_PROFILE,
      alertPreferences: DEFAULT_ALERT_PREFERENCES,
      routineStatuses: {},
      completedIndoorActionIds: [],
      impactHistory: [],
      communityPlan: DEFAULT_COMMUNITY_PLAN,
      saveStatus: clearRes.ok ? 'saved' : 'error',
      storageWarning: clearRes.ok ? null : (clearRes.message ?? 'Unable to clear local storage.'),
      aqErrorMessage: null,
      aiStatus: 'ready',
      aiStatusDetail: null,
    });
    await get().refreshAirQuality(false);
  },
}));
