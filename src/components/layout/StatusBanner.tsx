import { WifiOff } from 'lucide-react';
import type { ProviderConnectionStatus } from '../../store/useAppStore.ts';

export function StatusBanner({
  isOnline,
  aqStatus,
  isDemoMode,
}: {
  isOnline: boolean;
  aqStatus: ProviderConnectionStatus;
  isDemoMode: boolean;
}) {
  if (isOnline && aqStatus !== 'unavailable' && !isDemoMode) {
    return null;
  }

  return (
    <output
      aria-live="polite"
      className={`block border-b px-4 py-2 text-xs font-medium sm:text-sm ${
        isDemoMode
          ? 'border-amber-300 bg-amber-50 text-amber-950'
          : 'border-orange-300 bg-orange-50 text-orange-950'
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        {!isOnline && (
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <WifiOff className="h-4 w-4" aria-hidden="true" />
            Offline mode: saved household plans, routines, and indoor checklists remain available.
          </span>
        )}
        {isOnline && aqStatus === 'unavailable' && (
          <span>
            Air-quality forecast provider unreachable. Showing last saved reading if available—no
            live values are invented.
          </span>
        )}
        {isDemoMode && (
          <span>
            <strong>SAMPLE DEMO DATA ACTIVE:</strong> Synthetic Delhi winter-smog dataset for
            evaluation only—not a live station measurement.
          </span>
        )}
      </div>
    </output>
  );
}
