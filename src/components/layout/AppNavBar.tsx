import { Activity, CalendarClock, Home, Leaf, MessageSquare, Users, Wind } from 'lucide-react';
import type { AppRoute, StorageSaveStatus } from '../../store/types.ts';

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

function navToneClass(isActive: boolean, isAssistant: boolean, isMobile: boolean): string {
  if (isActive) {
    return isAssistant
      ? 'border border-amber-600 bg-amber-300/45 text-ink shadow-sm'
      : 'bg-brand text-white shadow-sm';
  }
  if (isAssistant) {
    return isMobile
      ? 'border border-amber-600/60 bg-amber-300/20 text-ink'
      : 'border border-amber-600/60 bg-amber-300/20 text-ink hover:bg-amber-300/35';
  }
  return isMobile ? 'text-ink-body' : 'text-ink-body hover:bg-hover-warm';
}

export function DesktopNavBar({
  activeRoute,
  onNavigate,
  saveStatus,
}: {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  saveStatus: StorageSaveStatus;
}) {
  return (
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 md:pb-2">
      <nav
        aria-label="Primary navigation"
        className="hidden flex-1 items-center gap-1 overflow-x-auto md:flex"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${navToneClass(isActive, item.id === 'assistant', false)}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <output
        aria-live="polite"
        className="text-ink-muted sr-only text-xs font-medium md:not-sr-only md:ml-auto"
      >
        {saveStatus === 'saving'
          ? 'Saving locally…'
          : saveStatus === 'saved'
            ? 'Saved locally'
            : saveStatus === 'error'
              ? 'Save error'
              : ''}
      </output>
    </div>
  );
}

export function MobileNavBar({
  activeRoute,
  onNavigate,
}: {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="border-border-warm bg-canvas/95 fixed right-0 bottom-0 left-0 z-30 flex items-center justify-around border-t px-1 py-1.5 backdrop-blur md:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeRoute === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl px-2 py-1 text-[11px] font-semibold ${navToneClass(isActive, item.id === 'assistant', true)}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="mt-0.5">{item.shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}
