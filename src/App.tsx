import { lazy, Suspense, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { HomeScreen } from './components/dashboard/HomeScreen.tsx';
import { HouseholdModal } from './components/dashboard/HouseholdModal.tsx';
import { LocationModal } from './components/dashboard/LocationModal.tsx';
import { AppShell } from './components/layout/AppShell.tsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx';
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

/**
 * Root application shell managing IndexedDB hydration, network listeners, route switching,
 * error boundaries, and top-level location/household dialogs.
 */
export function App() {
  const {
    hydrated,
    activeRoute,
    isOnline,
    saveStatus,
    storageWarning,
    locationPresets,
    selectedLocationId,
    aqStatus,
    aqErrorMessage,
    isDemoMode,
    aiStatus,
    aiStatusDetail,
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
  } = useAppStore(
    useShallow((s) => ({
      hydrated: s.hydrated,
      activeRoute: s.activeRoute,
      isOnline: s.isOnline,
      saveStatus: s.saveStatus,
      storageWarning: s.storageWarning,
      locationPresets: s.locationPresets,
      selectedLocationId: s.selectedLocationId,
      aqStatus: s.aqStatus,
      aqErrorMessage: s.aqErrorMessage,
      isDemoMode: s.isDemoMode,
      aiStatus: s.aiStatus,
      aiStatusDetail: s.aiStatusDetail,
      householdProfile: s.householdProfile,
      setRoute: s.setRoute,
      setOnlineStatus: s.setOnlineStatus,
      hydrateFromStorage: s.hydrateFromStorage,
      refreshAirQuality: s.refreshAirQuality,
      toggleDemoData: s.toggleDemoData,
      selectLocation: s.selectLocation,
      upsertLocationPreset: s.upsertLocationPreset,
      deleteLocationPreset: s.deleteLocationPreset,
      updateHouseholdProfile: s.updateHouseholdProfile,
      resetAllLocalData: s.resetAllLocalData,
    })),
  );

  const [locationModalOpen, setLocationModalOpen] = useState(() => {
    try {
      return !window.localStorage.getItem('saansathi_location_prompted');
    } catch (err) {
      void err;
      return false;
    }
  });
  const [householdModalOpen, setHouseholdModalOpen] = useState(false);

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  const handleLocationModalChange = (open: boolean) => {
    setLocationModalOpen(open);
    if (!open) {
      try {
        window.localStorage.setItem('saansathi_location_prompted', '1');
      } catch (err) {
        void err;
      }
    }
  };

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
      aqErrorMessage={aqErrorMessage}
      isDemoMode={isDemoMode}
      saveStatus={saveStatus}
      storageWarning={storageWarning}
      aiStatus={aiStatus}
      aiStatusDetail={aiStatusDetail}
      onOpenLocationModal={() => setLocationModalOpen(true)}
      onOpenHouseholdModal={() => setHouseholdModalOpen(true)}
      onRefreshAq={() => void refreshAirQuality(false)}
      onToggleDemo={() => void toggleDemoData()}
    >
      {!hydrated ? (
        <div className="border-border-warm bg-surface text-ink-muted rounded-2xl border p-6 text-sm">
          Loading saved household context from local storage…
        </div>
      ) : (
        <ErrorBoundary onResetRoute={() => setRoute('home')}>
          <Suspense
            fallback={
              <div className="border-border-warm bg-surface text-ink-muted rounded-2xl border p-6 text-sm">
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
        </ErrorBoundary>
      )}

      <LocationModal
        open={locationModalOpen}
        onOpenChange={handleLocationModalChange}
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
