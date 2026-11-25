import { useState } from 'react';
import { INDIA_CATEGORY_BY_NAME } from '../../data/aqi-standards.ts';
import type { AirQualityForecast } from '../../domain/air-quality/types.ts';
import { findBestOutdoorWindows, formatHourRange } from '../../engines/activity-window.ts';

export function HourlyForecastChart({ forecast }: { forecast: AirQualityForecast | null }) {
  const [showTable, setShowTable] = useState(false);

  if (!forecast || forecast.hourly.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#D6CCBA] bg-[#FAF7F2] p-4 text-sm text-[#57534E]">
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
          <p className="text-xs font-medium text-[#57534E]">
            Source: {forecast.sourceName} • {forecast.spatialResolutionNote}
          </p>
          {bestWindow && (
            <p className="mt-1 text-sm font-semibold text-[#0F6E56]">
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
          className="min-h-[36px] rounded-lg border border-[#D6CCBA] bg-[#FAF7F2] px-3 py-1 text-xs font-semibold text-[#1C1917] hover:bg-[#EFE8DA]"
        >
          {showTable ? 'Show visual chart' : 'View accessible data table'}
        </button>
      </div>

      {!showTable ? (
        <figure
          aria-label={`Hourly India NAQI forecast chart for ${forecast.city} over the next ${next18Hours.length} hours`}
          className="overflow-x-auto rounded-xl border border-[#E4DCCD] bg-[#FAF7F2] p-3"
        >
          <div className="flex min-w-[520px] items-end gap-1.5" style={{ height: '148px' }}>
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
                  <span className="text-[10px] font-semibold text-[#44403C]">
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
                  <span className="text-[10px] text-[#57534E]">{label}</span>
                </div>
              );
            })}
          </div>
        </figure>
      ) : (
        <div className="max-h-60 overflow-auto rounded-xl border border-[#E4DCCD]">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Hourly air quality forecast for {forecast.city}</caption>
            <thead className="bg-[#F3EDE2] text-[#1C1917]">
              <tr>
                <th className="px-3 py-2 font-semibold">Hour</th>
                <th className="px-3 py-2 font-semibold">Est. NAQI</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">PM2.5 (µg/m³)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4DCCD] bg-white">
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

      <p className="text-[11px] text-[#57534E]">
        Model forecast caveat: Values reflect ~11 km atmospheric grid estimates, not direct
        street-level monitoring stations.
      </p>
    </div>
  );
}
