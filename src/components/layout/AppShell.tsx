import {
  Activity,
  CalendarClock,
  Home,
  Leaf,
  MapPin,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Users,
  Wind,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { LocationPreset } from '../../domain/household/types.ts';
import type {
  AppRoute,
  ProviderConnectionStatus,
  StorageSaveStatus,
} from '../../store/useAppStore.ts';
import { StatusBanner } from './StatusBanner.tsx';

interface NavItem {
  id: AppRoute;
  label: string;
  shortLabel: string;
  icon: typeof Home;
}

const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', label: 'Home', shortLabel: 'Home', icon: Home },
  { id: 'routine', label: 'My Routine', shortLabel: 'Routine', icon: CalendarClock },
  { id: 'indoor', label: 'Indoor Air', shortLabel: 'Indoor', icon: Wind },
  { id: 'choices', label: 'Better Choices', shortLabel: 'Choices', icon: Leaf },
  { id: 'impact', label: 'Impact', shortLabel: 'Impact', icon: Activity },
  { id: 'community', label: 'Community', shortLabel: 'Community', icon: Users },
  { id: 'assistant', label: 'Ask Saansathi', shortLabel: 'Assistant', icon: MessageSquare },
];

export function AppShell({
  activeRoute,
  onNavigate,
  activeLocation,
  isOnline,
  aqStatus,
  isDemoMode,
  saveStatus,
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
  isDemoMode: boolean;
  saveStatus: StorageSaveStatus;
  onOpenLocationModal: () => void;
  onOpenHouseholdModal: () => void;
  onRefreshAq: () => void;
  onToggleDemo: () => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-[#0F6E56] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 border-b border-[#E4DCCD] bg-[#FAF7F2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F6E56] text-white shadow-sm">
              <Wind className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-[#1C1917]">
                Saansathi
              </span>
              <p className="text-xs text-[#57534E]">Make everyday choices for cleaner air</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#D6CCBA] bg-white px-3 py-1.5 text-sm font-medium text-[#1C1917] hover:bg-[#F3EDE2]"
              aria-label={`Change selected location, currently ${activeLocation.locality ? `${activeLocation.locality}, ` : ''}${activeLocation.city}`}
            >
              <MapPin className="h-4 w-4 text-[#0F6E56]" aria-hidden="true" />
              <span className="max-w-[160px] truncate">
                {activeLocation.locality
                  ? `${activeLocation.locality}, ${activeLocation.city}`
                  : activeLocation.city}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenHouseholdModal}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#D6CCBA] bg-white px-3 py-1.5 text-sm font-medium text-[#1C1917] hover:bg-[#F3EDE2]"
            >
              <ShieldCheck className="h-4 w-4 text-[#0F6E56]" aria-hidden="true" />
              <span className="hidden sm:inline">Family Context</span>
            </button>

            <button
              type="button"
              onClick={onRefreshAq}
              disabled={aqStatus === 'loading' || isDemoMode}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#D6CCBA] bg-white px-3 py-1.5 text-sm font-medium text-[#1C1917] hover:bg-[#F3EDE2] disabled:opacity-50"
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
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                isDemoMode
                  ? 'border-[#C2410C] bg-amber-100 text-amber-950'
                  : 'border-[#D6CCBA] bg-[#F3EDE2] text-[#44403C] hover:bg-[#E8DFCE]'
              }`}
            >
              {isDemoMode ? 'Exit Sample Demo' : 'Load Sample Demo'}
            </button>
          </div>
        </div>

        <nav
          aria-label="Primary navigation"
          className="mx-auto hidden max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-2 md:flex"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            const isAssistant = item.id === 'assistant';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? isAssistant
                      ? 'border border-amber-500 bg-amber-300/45 text-[#1C1917] shadow-sm'
                      : 'bg-[#0F6E56] text-white shadow-sm'
                    : isAssistant
                      ? 'border border-amber-400/50 bg-amber-300/20 text-[#1C1917] hover:bg-amber-300/35'
                      : 'text-[#44403C] hover:bg-[#EFE8DA]'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
          <span className="ml-auto text-xs font-medium text-[#57534E]" aria-live="polite">
            {saveStatus === 'saving'
              ? 'Saving locally…'
              : saveStatus === 'saved'
                ? 'Saved locally'
                : ''}
          </span>
        </nav>
      </header>

      <StatusBanner isOnline={isOnline} aqStatus={aqStatus} isDemoMode={isDemoMode} />

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 pt-5 pb-24 md:pb-10">
        {children}
      </main>

      <nav
        aria-label="Mobile navigation"
        className="fixed right-0 bottom-0 left-0 z-30 flex items-center justify-around border-t border-[#E4DCCD] bg-[#FAF7F2]/95 px-1 py-1.5 backdrop-blur md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.id;
          const isAssistant = item.id === 'assistant';
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl px-2 py-1 text-[11px] font-semibold ${
                isActive
                  ? isAssistant
                    ? 'border border-amber-500 bg-amber-300/45 text-[#1C1917]'
                    : 'bg-[#0F6E56] text-white'
                  : isAssistant
                    ? 'bg-amber-300/20 text-[#1C1917]'
                    : 'text-[#44403C]'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="mt-0.5">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      <footer className="border-t border-[#E4DCCD] bg-[#F3EDE2] px-4 py-5 text-xs text-[#57534E]">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <p>
            Saansathi provides environmental planning guidance—not medical diagnosis or treatment.
            Household profiles stay in local IndexedDB storage by default.
          </p>
          <p className="font-medium text-[#1C1917]">
            Index Standard: India NAQI (CPCB) • Model Forecast: Open-Meteo (~11 km)
          </p>
        </div>
      </footer>
    </div>
  );
}
