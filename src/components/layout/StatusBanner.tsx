import { AlertTriangle, WifiOff } from 'lucide-react';
import type { AiConnectionStatus, ProviderConnectionStatus } from '../../store/types.ts';

/**
 * Displays live connectivity, demo dataset, provider error, AI fallback, and storage warning notices.
 */
export function StatusBanner({
  isOnline,
  aqStatus,
  isDemoMode,
  aqErrorMessage = null,
  storageWarning = null,
  aiStatus = 'ready',
  aiStatusDetail = null,
}: {
  isOnline: boolean;
  aqStatus: ProviderConnectionStatus;
  isDemoMode: boolean;
  aqErrorMessage?: string | null;
  storageWarning?: string | null;
  aiStatus?: AiConnectionStatus;
  aiStatusDetail?: string | null;
}) {
  const showAiFallback = aiStatus === 'unavailable' && Boolean(aiStatusDetail);
  const showErrorOrStorage = Boolean(storageWarning) || Boolean(aqErrorMessage) || showAiFallback;

  if (
    isOnline &&
    aqStatus !== 'unavailable' &&
    aqStatus !== 'rate_limited' &&
    !isDemoMode &&
    !showErrorOrStorage
  ) {
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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1.5">
        {!isOnline && (
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <WifiOff className="h-4 w-4" aria-hidden="true" />
            Offline mode: saved household plans, routines, and indoor checklists remain available.
          </span>
        )}
        {isOnline && (aqStatus === 'unavailable' || aqStatus === 'rate_limited') && (
          <span>
            {aqErrorMessage ??
              'Air-quality forecast provider unreachable. Showing last saved reading if available—no live values are invented.'}
          </span>
        )}
        {isDemoMode && (
          <span>
            <strong>SAMPLE DEMO DATA ACTIVE:</strong> Synthetic Delhi winter-smog dataset for
            evaluation only—not a live station measurement.
          </span>
        )}
        {storageWarning && (
          <span className="text-danger-ink inline-flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Storage notice: {storageWarning}
          </span>
        )}
        {showAiFallback && (
          <span>Assistant notice: {aiStatusDetail} (Deterministic rules remain active.)</span>
        )}
      </div>
    </output>
  );
}
