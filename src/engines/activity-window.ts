import type { AirQualityForecast, HourlyForecastPoint } from '../domain/air-quality/types.ts';
import type { OutdoorWindow } from '../domain/routine/types.ts';

function getHourFromIso(iso: string): number {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 0 : d.getHours();
}

/**
 * Finds the best contiguous 2-hour daytime/early-evening outdoor window from forecast data.
 * Never invents a guaranteed safe period: when all forecast hours are Poor/Very Poor/Severe,
 * explicitly frames it as a "comparatively lower-pollution window" with caveats.
 */
export function findBestOutdoorWindows(
  forecast: AirQualityForecast | null,
  nowMs: number = Date.now(),
): OutdoorWindow[] {
  if (!forecast || forecast.hourly.length < 2) {
    return [];
  }

  const upcoming: HourlyForecastPoint[] = forecast.hourly.filter((pt) => {
    const t = Date.parse(pt.timestamp);
    return !Number.isNaN(t) && t >= nowMs - 3600 * 1000 && pt.estimatedIndiaNaqi !== null;
  });

  if (upcoming.length < 2) {
    return [];
  }

  const candidates: OutdoorWindow[] = [];
  for (let i = 0; i < upcoming.length - 1 && i < 24; i++) {
    const first = upcoming[i];
    const second = upcoming[i + 1];
    if (!first || !second) continue;
    if (first.estimatedIndiaNaqi === null || second.estimatedIndiaNaqi === null) continue;

    const startHour = getHourFromIso(first.timestamp);
    // Restrict suggested outdoor activity windows to practical waking hours (06:00–21:00)
    if (startHour < 6 || startHour > 19) continue;

    const avg = Math.round((first.estimatedIndiaNaqi + second.estimatedIndiaNaqi) / 2);
    const category =
      avg <= 50
        ? 'Good'
        : avg <= 100
          ? 'Satisfactory'
          : avg <= 200
            ? 'Moderate'
            : avg <= 300
              ? 'Poor'
              : avg <= 400
                ? 'Very Poor'
                : 'Severe';

    candidates.push({
      startHour,
      endHour: (startHour + 2) % 24,
      startIso: first.timestamp,
      endIso: second.timestamp,
      averageEstimatedAqi: avg,
      category,
      confidenceNote:
        avg > 200
          ? 'Model-estimated lowest dip—still elevated; keep outdoor trips brief and non-strenuous.'
          : 'Model-estimated lower-pollution window (~11 km grid); verify local visibility before heading out.',
    });
  }

  candidates.sort((a, b) => a.averageEstimatedAqi - b.averageEstimatedAqi);
  return candidates.slice(0, 2);
}

export function formatHourRange(startHour: number, endHour: number): string {
  const fmt = (h: number) => {
    const norm = ((h % 24) + 24) % 24;
    const period = norm >= 12 ? 'PM' : 'AM';
    const hour12 = norm % 12 === 0 ? 12 : norm % 12;
    return `${hour12}:00 ${period}`;
  };
  return `${fmt(startHour)} – ${fmt(endHour)}`;
}
