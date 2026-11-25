import { Bell } from 'lucide-react';
import type { AlertPreferences, CleanAirAlert } from '../../domain/alerts/types.ts';
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
          <Bell className="h-4 w-4 text-[#C2410C]" aria-hidden="true" />
          <h2 className="text-sm font-bold text-[#1C1917]">Pollution-Aware Reminders</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="inline-flex items-center gap-1.5 font-medium text-[#44403C]">
            Alert from:
            <select
              value={alertPreferences.notifyOnCategoryAtOrAbove}
              onChange={(e) =>
                onUpdatePreferences({
                  ...alertPreferences,
                  notifyOnCategoryAtOrAbove: e.target.value as
                    'Moderate' | 'Poor' | 'Very Poor' | 'Severe',
                })
              }
              aria-label="Alert threshold category"
              className="rounded-lg border border-[#D6CCBA] bg-white px-2 py-1 text-xs font-semibold text-[#1C1917]"
            >
              <option value="Moderate">Moderate (101+)</option>
              <option value="Poor">Poor (201+)</option>
              <option value="Very Poor">Very Poor (301+)</option>
              <option value="Severe">Severe (401+)</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() =>
              onUpdatePreferences({
                ...alertPreferences,
                enabled: !alertPreferences.enabled,
              })
            }
            className="rounded-lg border border-[#D6CCBA] bg-white px-2.5 py-1 text-xs font-semibold text-[#1C1917] hover:bg-[#EFE8DA]"
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
              className="rounded-xl border border-orange-200 bg-white p-3 text-xs sm:text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-[#1C1917]">{al.title}</strong>
                <Badge className="border-[#E4DCCD] bg-[#FAF7F2] text-[#44403C]">
                  {al.isForecastBased ? 'Forecast-based' : 'Schedule check'}
                </Badge>
              </div>
              <p className="mt-1 text-[#44403C]">{al.message}</p>
              <p className="mt-1 font-medium text-[#0F6E56]">Next step: {al.nextStep}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-1.5 text-xs text-[#57534E]">
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
