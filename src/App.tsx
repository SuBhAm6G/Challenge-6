import { lazy, Suspense, useEffect, useState } from 'react';
import { HomeScreen } from './components/dashboard/HomeScreen.tsx';
import { HouseholdModal } from './components/dashboard/HouseholdModal.tsx';
import { LocationModal } from './components/dashboard/LocationModal.tsx';
import { AppShell } from './components/layout/AppShell.tsx';
import { DEFAULT_DEMO_LOCATION } from './store/defaults.ts';
import { useAppStore } from './store/useAppStore.ts';

const RoutineScreen = lazy(() =>
  import('./components/routine/RoutineScreen.tsx').then((m) => ({ default: m.RoutineScreen })),
);
const IndoorScreen = lazy(() =>
  import('./components/indoor/IndoorScreen.tsx').then((m) => ({ default: m.IndoorScreen })),
);
const ChoicesScreen = lazy(() =>
  import('./components/choices/ChoicesScreen.tsx').then((m) => ({ default: m.ChoicesScreen })),
);
const ImpactScreen = lazy(() =>
  import('./components/impact/ImpactScreen.tsx').then((m) => ({ default: m.ImpactScreen })),
);
const CommunityScreen = lazy(() =>
  import('./components/community/CommunityScreen.tsx').then((m) => ({
    default: m.CommunityScreen,
  })),
);
const AssistantScreen = lazy(() =>
  import('./components/assistant/AssistantScreen.tsx').then((m) => ({
    default: m.AssistantScreen,
  })),
);

export function App() {
  const {
    hydrated,
    activeRoute,
    isOnline,
    saveStatus,
    locationPresets,
    selectedLocationId,
    aqStatus,
    isDemoMode,
    householdProfile,
    setRoute,
    setOnlineStatus,
    hydrateFromStorage,
    refreshAirQuality,
    toggleDemoData,
    selectLocation,
    upsertLocationPreset,
    deleteLocationPreset,
    updateHouseholdProfile,
    resetAllLocalData,
  } = useAppStore();

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [householdModalOpen, setHouseholdModalOpen] = useState(false);

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true);
      void refreshAirQuality(useAppStore.getState().isDemoMode);
    };
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus, refreshAirQuality]);

  const activeLocation =
    locationPresets.find((l) => l.id === selectedLocationId) ??
    locationPresets[0] ??
    DEFAULT_DEMO_LOCATION;

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={setRoute}
      activeLocation={activeLocation}
      isOnline={isOnline}
      aqStatus={aqStatus}
      isDemoMode={isDemoMode}
      saveStatus={saveStatus}
      onOpenLocationModal={() => setLocationModalOpen(true)}
      onOpenHouseholdModal={() => setHouseholdModalOpen(true)}
      onRefreshAq={() => void refreshAirQuality(false)}
      onToggleDemo={() => void toggleDemoData()}
    >
      {!hydrated ? (
        <div className="rounded-2xl border border-[#E4DCCD] bg-white p-6 text-sm text-[#57534E]">
          Loading saved household context from local storage…
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#E4DCCD] bg-white p-6 text-sm text-[#57534E]">
              Loading section…
            </div>
          }
        >
          {activeRoute === 'home' && <HomeScreen />}
          {activeRoute === 'routine' && <RoutineScreen />}
          {activeRoute === 'indoor' && <IndoorScreen />}
          {activeRoute === 'choices' && <ChoicesScreen />}
          {activeRoute === 'impact' && <ImpactScreen />}
          {activeRoute === 'community' && <CommunityScreen />}
          {activeRoute === 'assistant' && <AssistantScreen />}
        </Suspense>
      )}

      <LocationModal
        open={locationModalOpen}
        onOpenChange={setLocationModalOpen}
        presets={locationPresets}
        selectedId={selectedLocationId}
        onSelect={(id) => void selectLocation(id)}
        onSavePreset={(preset) => void upsertLocationPreset(preset)}
        onDeletePreset={(id) => void deleteLocationPreset(id)}
      />

      <HouseholdModal
        open={householdModalOpen}
        onOpenChange={setHouseholdModalOpen}
        profile={householdProfile}
        onSave={(next) => void updateHouseholdProfile(next)}
        onResetAll={() => void resetAllLocalData()}
      />
    </AppShell>
  );
}

export default App;
