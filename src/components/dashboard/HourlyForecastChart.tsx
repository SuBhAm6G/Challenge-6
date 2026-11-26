import { useState } from 'react';
import { INDIA_CATEGORY_BY_NAME } from '../../data/aqi-standards.ts';
import type { AirQualityForecast } from '../../domain/air-quality/types.ts';
import { findBestOutdoorWindows, formatHourRange } from '../../engines/activity-window.ts';

export function HourlyForecastChart({ forecast }: { forecast: AirQualityForecast | null }) {
  const [showTable, setShowTable] = useState(false);

  if (!forecast || forecast.hourly.length === 0) {
    return (
      <div className="border-border-strong bg-canvas text-ink-muted rounded-xl border border-dashed p-4 text-sm">
        Hourly forecast data is currently unavailable. Refresh when online to view today’s timing
        outlook.
      </div>
    );
  }

  const next18Hours = forecast.hourly.slice(0, 18);
  const maxAqi = Math.max(250, ...next18Hours.map((pt) => pt.estimatedIndiaNaqi ?? 0));
  const windows = findBestOutdoorWindows(forecast);
  const bestWindow = windows[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-ink-muted text-xs font-medium">
            Source: {forecast.sourceName} • {forecast.spatialResolutionNote}
          </p>
          {bestWindow && (
            <p className="text-brand mt-1 text-sm font-semibold">
              Comparatively lower-AQI window:{' '}
              {formatHourRange(bestWindow.startHour, bestWindow.endHour)} (est. NAQI ~
              {bestWindow.averageEstimatedAqi}, {bestWindow.category})
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-expanded={showTable}
          className="border-border-strong bg-canvas text-ink hover:bg-hover-warm min-h-[44px] rounded-lg border px-3 py-1.5 text-xs font-semibold"
        >
          {showTable ? 'Show visual chart' : 'View accessible data table'}
        </button>
      </div>

      {!showTable ? (
        <figure
          aria-label={`Hourly India NAQI forecast chart for ${forecast.city} over the next ${next18Hours.length} hours`}
          className="border-border-warm bg-canvas rounded-xl border p-3"
        >
          <div className="flex w-full min-w-0 items-end gap-1" style={{ height: '148px' }}>
            {next18Hours.map((pt) => {
              const val = pt.estimatedIndiaNaqi ?? 0;
              const pct = Math.max(8, Math.round((val / maxAqi) * 100));
              const meta = pt.estimatedCategory
                ? INDIA_CATEGORY_BY_NAME.get(pt.estimatedCategory)
                : undefined;
              const hour = new Date(pt.timestamp).getHours();
              const label = `${hour % 12 === 0 ? 12 : hour % 12}${hour >= 12 ? 'p' : 'a'}`;

              return (
                <div key={pt.timestamp} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-ink-body text-[10px] font-semibold">
                    {pt.estimatedIndiaNaqi ?? '–'}
                  </span>
                  <div className="flex h-24 w-full items-end">
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${pct}%`,
                        backgroundColor: meta?.accentHex ?? '#78716C',
                      }}
                      title={`${label}: NAQI ${pt.estimatedIndiaNaqi ?? 'N/A'} (${pt.estimatedCategory ?? 'Unknown'})`}
                    />
                  </div>
                  <span className="text-ink-muted text-[10px]">{label}</span>
                </div>
              );
            })}
          </div>
        </figure>
      ) : (
        <div className="border-border-warm max-h-60 overflow-auto rounded-xl border">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Hourly air quality forecast for {forecast.city}</caption>
            <thead className="bg-subtle text-ink">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Hour
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Est. NAQI
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Category
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  PM2.5 (µg/m³)
                </th>
              </tr>
            </thead>
            <tbody className="divide-border-warm bg-surface divide-y">
              {next18Hours.map((pt) => {
                const pm25 = pt.pollutants.find((p) => p.pollutant === 'pm25');
                return (
                  <tr key={pt.timestamp}>
                    <td className="px-3 py-1.5">
                      {new Date(pt.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-1.5 font-semibold">{pt.estimatedIndiaNaqi ?? 'N/A'}</td>
                    <td className="px-3 py-1.5">{pt.estimatedCategory ?? 'Unavailable'}</td>
                    <td className="px-3 py-1.5">{pm25 ? pm25.concentration : 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-ink-muted text-[11px]">
        Model forecast caveat: Values reflect ~11 km atmospheric grid estimates, not direct
        street-level monitoring stations.
      </p>
    </div>
  );
}
