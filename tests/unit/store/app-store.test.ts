import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_DEMO_HOUSEHOLD, DEFAULT_DEMO_LOCATION } from '../../../src/data/cities.ts';
import { resetDbHandleForTests } from '../../../src/storage/db.ts';
import { LocalStorageRepo } from '../../../src/storage/repositories.ts';
import { DEFAULT_INDOOR_PROFILE } from '../../../src/store/defaults.ts';
import { useAppStore } from '../../../src/store/useAppStore.ts';

function stubOpenMeteoFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            latitude: 28.6,
            longitude: 77.2,
            current: {
              time: '2026-11-25T10:00',
              pm2_5: 190,
              pm10: 280,
              carbon_monoxide: 1800,
              nitrogen_dioxide: 70,
              sulphur_dioxide: 15,
              ozone: 42,
              european_aqi: 90,
            },
            hourly: {
              time: ['2026-11-25T10:00', '2026-11-25T11:00'],
              pm2_5: [190, 160],
              pm10: [280, 240],
              carbon_monoxide: [1800, 1500],
              nitrogen_dioxide: [70, 60],
              sulphur_dioxide: [15, 13],
              ozone: [42, 48],
            },
          }),
          { status: 200 },
        ),
    ),
  );
}

describe('Zustand App Store & Slices', () => {
  beforeEach(async () => {
    resetDbHandleForTests();
    await LocalStorageRepo.clearAll();
    useAppStore.setState({
      hydrated: false,
      activeRoute: 'home',
      locationPresets: [DEFAULT_DEMO_LOCATION],
      selectedLocationId: DEFAULT_DEMO_LOCATION.id,
      householdProfile: DEFAULT_DEMO_HOUSEHOLD,
      indoorProfile: DEFAULT_INDOOR_PROFILE,
      routineStatuses: {},
      completedIndoorActionIds: [],
      impactHistory: [],
      isDemoMode: false,
    });
    stubOpenMeteoFetch();
  });

  it('hydrates stored state and fetches live model AQ forecast', async () => {
    await useAppStore.getState().hydrateFromStorage();
    const state = useAppStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.aqStatus).toBe('ready');
    expect(state.isDemoMode).toBe(false);
    expect(state.aqiResult.standard).toBe('INDIA_NAQI');
    expect(state.aqiResult.value).toBeGreaterThan(300);
  });

  it('toggles sample demo mode on and off cleanly', async () => {
    await useAppStore.getState().toggleDemoData();
    expect(useAppStore.getState().isDemoMode).toBe(true);
    expect(useAppStore.getState().currentReading?.sourceType).toBe('sample_data');

    await useAppStore.getState().toggleDemoData();
    expect(useAppStore.getState().isDemoMode).toBe(false);
    expect(useAppStore.getState().currentReading?.sourceType).toBe('model_forecast');
  });

  it('upserts and deletes location presets while refusing to delete the final preset', async () => {
    await useAppStore.getState().upsertLocationPreset({
      id: 'loc-mumbai',
      label: 'work',
      customName: 'Work',
      city: 'Mumbai',
      locality: 'Bandra',
      state: 'Maharashtra',
      latitude: 19.076,
      longitude: 72.8777,
      precision: 'locality',
    });
    expect(useAppStore.getState().locationPresets).toHaveLength(2);
    expect(useAppStore.getState().selectedLocationId).toBe('loc-mumbai');

    await useAppStore.getState().deleteLocationPreset('loc-mumbai');
    expect(useAppStore.getState().locationPresets).toHaveLength(1);
    expect(useAppStore.getState().selectedLocationId).toBe(DEFAULT_DEMO_LOCATION.id);

    // Must not delete the last remaining preset
    await useAppStore.getState().deleteLocationPreset(DEFAULT_DEMO_LOCATION.id);
    expect(useAppStore.getState().locationPresets).toHaveLength(1);
  });

  it('persists household, indoor, routine, impact, and community mutations and supports full reset', async () => {
    const store = useAppStore.getState();
    await store.updateHouseholdProfile({ ...DEFAULT_DEMO_HOUSEHOLD, name: 'Patel Household' });
    await store.updateIndoorProfile({ ...DEFAULT_INDOOR_PROFILE, hasAirPurifier: true });
    await store.setRoutineStatus('rec-school-planning', 'completed');
    await store.toggleIndoorAction('indoor-stop-burning');
    await store.toggleIndoorAction('indoor-stop-burning');
    await store.toggleIndoorAction('indoor-kitchen-exhaust');
    await store.recordImpactEntry({
      id: 'imp-1',
      dateIso: '2026-11-25T10:00:00.000Z',
      impactType: 'transport_emissions',
      title: 'Car to Metro',
      exposureNote: 'Platform exposure note',
      co2eAvoidedKg: 6.5,
      vehicleTripsAvoided: 4,
      confidence: 'moderate',
    });
    await store.addCommunityAction({
      id: 'comm-custom',
      title: 'Stop leaf burning near Park B',
      responsibleRole: 'RWA Security',
      suggestedDeadline: 'Tomorrow',
      status: 'planned',
      effort: 'low_cost',
      explanation: 'Eliminates local PM2.5 hotspot',
    });
    await store.updateCommunityActionStatus('comm-custom', 'completed');

    const updated = useAppStore.getState();
    expect(updated.householdProfile.name).toBe('Patel Household');
    expect(updated.indoorProfile.hasAirPurifier).toBe(true);
    expect(updated.routineStatuses['rec-school-planning']).toBe('completed');
    expect(updated.completedIndoorActionIds).toEqual(['indoor-kitchen-exhaust']);
    expect(updated.impactHistory).toHaveLength(1);
    expect(updated.communityPlan.actions[0]?.status).toBe('completed');

    await updated.resetAllLocalData();
    const afterReset = useAppStore.getState();
    expect(afterReset.householdProfile.name).toBe(DEFAULT_DEMO_HOUSEHOLD.name);
    expect(afterReset.completedIndoorActionIds).toEqual([]);
    expect(afterReset.impactHistory).toEqual([]);
  });

  it('falls back to cached IndexedDB AQ reading when provider fails offline', async () => {
    await useAppStore.getState().refreshAirQuality(false);
    expect(useAppStore.getState().aqStatus).toBe('ready');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('Network offline');
      }),
    );
    await useAppStore.getState().refreshAirQuality(false);
    const state = useAppStore.getState();
    expect(state.aqStatus).toBe('unavailable');
    expect(state.currentReading).not.toBeNull();
    expect(state.aqErrorMessage).toContain('Showing last saved reading');
  });
});
