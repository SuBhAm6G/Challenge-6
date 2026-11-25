import type { StateCreator } from 'zustand';
import { interpretIndiaNAQI } from '../engines/aqi-interpreter.ts';
import { OpenMeteoAirQualityProvider } from '../providers/open-meteo.ts';
import { buildSampleWinterSmogBundle } from '../providers/sample-data.ts';
import { ProviderError } from '../providers/types.ts';
import { LocalStorageRepo } from '../storage/repositories.ts';
import { DEFAULT_DEMO_LOCATION, EMPTY_AQI_RESULT, locationCacheKey } from './defaults.ts';
import type { AppStoreState } from './types.ts';

const openMeteoProvider = new OpenMeteoAirQualityProvider();
let activeAqRequestId = 0;

export type AqSlice = Pick<
  AppStoreState,
  | 'locationPresets'
  | 'selectedLocationId'
  | 'currentReading'
  | 'forecast'
  | 'aqiResult'
  | 'previousCategory'
  | 'aqStatus'
  | 'aqErrorMessage'
  | 'isDemoMode'
  | 'refreshAirQuality'
  | 'toggleDemoData'
  | 'selectLocation'
  | 'upsertLocationPreset'
  | 'deleteLocationPreset'
>;

export const createAqSlice: StateCreator<AppStoreState, [], [], AqSlice> = (set, get) => ({
  locationPresets: [DEFAULT_DEMO_LOCATION],
  selectedLocationId: DEFAULT_DEMO_LOCATION.id,
  currentReading: null,
  forecast: null,
  aqiResult: EMPTY_AQI_RESULT,
  previousCategory: null,
  aqStatus: 'idle',
  aqErrorMessage: null,
  isDemoMode: false,

  refreshAirQuality: async (forceSample = false) => {
    const loc =
      get().locationPresets.find((p) => p.id === get().selectedLocationId) ?? DEFAULT_DEMO_LOCATION;
    const requestId = ++activeAqRequestId;

    if (forceSample) {
      const sample = buildSampleWinterSmogBundle(
        loc.city,
        `${loc.locality ? `${loc.locality}, ` : ''}${loc.city} (Sample Demo)`,
        loc.latitude,
        loc.longitude,
      );
      set({
        currentReading: sample.current,
        forecast: sample.forecast,
        aqiResult: interpretIndiaNAQI(sample.current.pollutants),
        aqStatus: 'ready',
        aqErrorMessage: null,
        isDemoMode: true,
      });
      return;
    }

    set({ aqStatus: 'loading', aqErrorMessage: null });
    try {
      const bundle = await openMeteoProvider.fetchCurrentAndForecast({
        city: loc.city,
        locationName: loc.locality ? `${loc.locality}, ${loc.city}` : loc.city,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      if (requestId !== activeAqRequestId) return;
      const prevCategory = get().aqiResult.category;
      set({
        currentReading: bundle.current,
        forecast: bundle.forecast,
        aqiResult: interpretIndiaNAQI(bundle.current.pollutants),
        previousCategory: prevCategory,
        aqStatus: 'ready',
        aqErrorMessage: null,
        isDemoMode: false,
      });
      const cacheRes = await LocalStorageRepo.saveCachedAq(
        locationCacheKey(loc),
        bundle.current,
        bundle.forecast,
      );
      if (!cacheRes.ok && cacheRes.message) set({ storageWarning: cacheRes.message });
    } catch (err) {
      if (requestId !== activeAqRequestId) return;
      const isRateLimit = err instanceof ProviderError && err.code === 'rate_limit';
      const msg = err instanceof Error ? err.message : 'Air-quality provider unavailable.';
      const cached = await LocalStorageRepo.loadCachedAq(locationCacheKey(loc));
      if (requestId !== activeAqRequestId) return;
      if (cached.ok && cached.data) {
        set({
          currentReading: cached.data.reading,
          forecast: cached.data.forecast,
          aqiResult: interpretIndiaNAQI(cached.data.reading.pollutants),
          aqStatus: isRateLimit ? 'rate_limited' : 'unavailable',
          aqErrorMessage: `${msg} Showing last saved reading with its original timestamp.`,
          isDemoMode: false,
        });
      } else {
        set({
          currentReading: null,
          forecast: null,
          aqiResult: EMPTY_AQI_RESULT,
          aqStatus: isRateLimit ? 'rate_limited' : 'unavailable',
          aqErrorMessage: `${msg} No saved reading available offline for ${loc.city}.`,
          isDemoMode: false,
        });
      }
    }
  },

  toggleDemoData: async () => get().refreshAirQuality(!get().isDemoMode),

  selectLocation: async (id) => {
    set({ selectedLocationId: id, saveStatus: 'saving' });
    const res = await LocalStorageRepo.saveSelectedLocationId(id);
    set({ saveStatus: res.ok ? 'saved' : 'error', storageWarning: res.message ?? null });
    await get().refreshAirQuality(get().isDemoMode);
  },

  upsertLocationPreset: async (preset) => {
    const list = get().locationPresets;
    const next = list.some((p) => p.id === preset.id)
      ? list.map((p) => (p.id === preset.id ? preset : p))
      : [...list, preset];
    set({ locationPresets: next, selectedLocationId: preset.id, saveStatus: 'saving' });
    await Promise.all([
      LocalStorageRepo.saveLocationPresets(next),
      LocalStorageRepo.saveSelectedLocationId(preset.id),
    ]);
    set({ saveStatus: 'saved' });
    await get().refreshAirQuality(get().isDemoMode);
  },

  deleteLocationPreset: async (id) => {
    const list = get().locationPresets;
    if (list.length <= 1) return;
    const next = list.filter((p) => p.id !== id);
    const nextSel =
      get().selectedLocationId === id
        ? (next[0]?.id ?? DEFAULT_DEMO_LOCATION.id)
        : get().selectedLocationId;
    set({ locationPresets: next, selectedLocationId: nextSel, saveStatus: 'saving' });
    await Promise.all([
      LocalStorageRepo.saveLocationPresets(next),
      LocalStorageRepo.saveSelectedLocationId(nextSel),
    ]);
    set({ saveStatus: 'saved' });
    await get().refreshAirQuality(get().isDemoMode);
  },
});
