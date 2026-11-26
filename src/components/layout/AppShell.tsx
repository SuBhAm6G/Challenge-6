import { MapPin, RefreshCw, ShieldCheck, Wind } from 'lucide-react';
import type { ReactNode } from 'react';
import type { LocationPreset } from '../../domain/household/types.ts';
import type {
  AiConnectionStatus,
  AppRoute,
  ProviderConnectionStatus,
  StorageSaveStatus,
} from '../../store/types.ts';
import { DesktopNavBar, MobileNavBar } from './AppNavBar.tsx';
import { StatusBanner } from './StatusBanner.tsx';

export function AppShell({
  activeRoute,
  onNavigate,
  activeLocation,
  isOnline,
  aqStatus,
  aqErrorMessage,
  isDemoMode,
  saveStatus,
  storageWarning,
  aiStatus,
  aiStatusDetail,
  onOpenLocationModal,
  onOpenHouseholdModal,
  onRefreshAq,
  onToggleDemo,
  children,
}: {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  activeLocation: LocationPreset;
  isOnline: boolean;
  aqStatus: ProviderConnectionStatus;
  aqErrorMessage?: string | null;
  isDemoMode: boolean;
  saveStatus: StorageSaveStatus;
  storageWarning?: string | null;
  aiStatus?: AiConnectionStatus;
  aiStatusDetail?: string | null;
  onOpenLocationModal: () => void;
  onOpenHouseholdModal: () => void;
  onRefreshAq: () => void;
  onToggleDemo: () => void;
  children: ReactNode;
}) {
  return (
    <div className="bg-canvas text-ink min-h-screen">
      <a
        href="#main-content"
        className="focus:bg-brand sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <header className="border-border-warm bg-canvas/95 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="bg-brand flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm">
              <Wind className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-ink text-lg font-extrabold tracking-tight">Saansathi</span>
              <p className="text-ink-muted text-xs">Make everyday choices for cleaner air</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="border-border-strong bg-surface text-ink hover:bg-subtle inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium"
              aria-label={`Change selected location, currently ${activeLocation.locality ? `${activeLocation.locality}, ` : ''}${activeLocation.city}`}
            >
              <MapPin className="text-brand h-4 w-4" aria-hidden="true" />
              <span className="max-w-[160px] truncate">
                {activeLocation.locality
                  ? `${activeLocation.locality}, ${activeLocation.city}`
                  : activeLocation.city}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenHouseholdModal}
              className="border-border-strong bg-surface text-ink hover:bg-subtle inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium"
            >
              <ShieldCheck className="text-brand h-4 w-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Family Context</span>
            </button>

            <button
              type="button"
              onClick={onRefreshAq}
              disabled={aqStatus === 'loading' || isDemoMode}
              className="border-border-strong bg-surface text-ink hover:bg-subtle inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
              aria-label="Refresh air quality data"
              title="Refresh air quality data"
            >
              <RefreshCw
                className={`h-4 w-4 ${aqStatus === 'loading' ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span className="sr-only sm:not-sr-only">Refresh</span>
            </button>

            <button
              type="button"
              onClick={onToggleDemo}
              aria-pressed={isDemoMode}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                isDemoMode
                  ? 'border-alert bg-amber-100 text-amber-950'
                  : 'border-border-strong bg-subtle text-ink-body hover:bg-hover-warm'
              }`}
            >
              {isDemoMode ? 'Exit Sample Demo' : 'Load Sample Demo'}
            </button>
          </div>
        </div>

        <DesktopNavBar activeRoute={activeRoute} onNavigate={onNavigate} saveStatus={saveStatus} />
      </header>

      <StatusBanner
        isOnline={isOnline}
        aqStatus={aqStatus}
        aqErrorMessage={aqErrorMessage}
        isDemoMode={isDemoMode}
        storageWarning={storageWarning}
        aiStatus={aiStatus}
        aiStatusDetail={aiStatusDetail}
      />

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 pt-5 pb-24 md:pb-10">
        {children}
      </main>

      <MobileNavBar activeRoute={activeRoute} onNavigate={onNavigate} />

      <footer className="border-border-warm bg-subtle text-ink-muted border-t px-4 py-5 text-xs">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <p>
            Saansathi provides environmental planning guidance—not medical diagnosis or treatment.
            Household profiles stay in local IndexedDB storage by default.
          </p>
          <p className="text-ink font-medium">
            Index Standard: India NAQI (CPCB) • Model Forecast: Open-Meteo (~11 km)
          </p>
        </div>
      </footer>
    </div>
  );
}
