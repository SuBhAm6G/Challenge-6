import { Bell } from 'lucide-react';
import { IndiaAQICategorySchema } from '../../domain/air-quality/types.ts';
import type { AlertPreferences, CleanAirAlert } from '../../domain/alerts/types.ts';
import { parseEnumValue } from '../../domain/select-guards.ts';
import { Badge, Card } from '../ui/Primitives.tsx';

export function AlertsCard({
  alerts,
  alertPreferences,
  onUpdatePreferences,
}: {
  alerts: CleanAirAlert[];
  alertPreferences: AlertPreferences;
  onUpdatePreferences: (prefs: AlertPreferences) => void;
}) {
  return (
    <Card className={alerts.length > 0 ? 'border-orange-300 bg-orange-50/60' : ''}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="text-alert h-4 w-4" aria-hidden="true" />
          <h2 className="text-ink text-sm font-bold">Pollution-Aware Reminders</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label
            htmlFor="alert-threshold-select"
            className="text-ink-body inline-flex items-center gap-1.5 font-medium"
          >
            Alert threshold:
          </label>
          <select
            id="alert-threshold-select"
            value={alertPreferences.notifyOnCategoryAtOrAbove}
            onChange={(e) =>
              onUpdatePreferences({
                ...alertPreferences,
                notifyOnCategoryAtOrAbove: parseEnumValue(
                  IndiaAQICategorySchema,
                  e.target.value,
                  alertPreferences.notifyOnCategoryAtOrAbove,
                ),
              })
            }
            className="border-border-strong bg-surface text-ink min-h-[44px] rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
          >
            <option value="Moderate">Moderate (101+)</option>
            <option value="Poor">Poor (201+)</option>
            <option value="Very Poor">Very Poor (301+)</option>
            <option value="Severe">Severe (401+)</option>
          </select>
          <button
            type="button"
            aria-pressed={!alertPreferences.enabled}
            onClick={() =>
              onUpdatePreferences({
                ...alertPreferences,
                enabled: !alertPreferences.enabled,
              })
            }
            className="border-border-strong bg-surface text-ink hover:bg-hover-warm min-h-[44px] rounded-lg border px-3 py-1.5 text-xs font-semibold"
          >
            {alertPreferences.enabled ? 'Pause alerts' : 'Enable alerts'}
          </button>
        </div>
      </div>

      {alerts.length > 0 ? (
        <div className="mt-2 space-y-2">
          {alerts.map((al) => (
            <div
              key={al.id}
              className="bg-surface rounded-xl border border-orange-200 p-3 text-xs sm:text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-ink">{al.title}</strong>
                <Badge className="border-border-warm bg-canvas text-ink-body">
                  {al.isForecastBased ? 'Forecast-based' : 'Schedule check'}
                </Badge>
              </div>
              <p className="text-ink-body mt-1">{al.message}</p>
              <p className="text-brand mt-1 font-medium">Next step: {al.nextStep}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-ink-muted mt-1.5 text-xs">
          No active threshold alerts right now under India NAQI (
          {alertPreferences.enabled
            ? `threshold: ${alertPreferences.notifyOnCategoryAtOrAbove}`
            : 'alerts paused'}
          ).
        </p>
      )}
    </Card>
  );
}
