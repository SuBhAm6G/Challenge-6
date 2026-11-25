import { Info } from 'lucide-react';
import { INDIA_CATEGORY_BY_NAME } from '../../data/aqi-standards.ts';
import { POLLUTANT_CATALOG } from '../../data/pollutants.ts';
import type { AirQualityReading, AQIResult } from '../../domain/air-quality/types.ts';
import type { LocationPreset } from '../../domain/household/types.ts';
import type { FreshnessEvaluation } from '../../engines/freshness.ts';
import { Badge, Card } from '../ui/Primitives.tsx';

export function AqiHeroCard({
  activeLocation,
  currentReading,
  aqiResult,
  freshness,
}: {
  activeLocation: LocationPreset | undefined;
  currentReading: AirQualityReading | null;
  aqiResult: AQIResult;
  freshness: FreshnessEvaluation;
}) {
  const catMeta = aqiResult.category ? INDIA_CATEGORY_BY_NAME.get(aqiResult.category) : undefined;

  return (
    <Card>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-[#D6CCBA] bg-[#FAF7F2] text-[#1C1917]">
              {currentReading?.forecastVsObserved === 'sample'
                ? 'Sample Demo Data'
                : currentReading?.forecastVsObserved === 'forecast'
                  ? 'Model Forecast (~11 km)'
                  : currentReading?.forecastVsObserved === 'observed'
                    ? 'Station Observation'
                    : 'No Active Data'}
            </Badge>
            <Badge
              className={
                freshness.isStaleOrUncertain
                  ? 'border-amber-300 bg-amber-50 text-amber-950'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-950'
              }
            >
              {freshness.label}
            </Badge>
            <span className="text-xs text-[#57534E]">{freshness.detail}</span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-[#1C1917] sm:text-3xl">
            {activeLocation?.locality
              ? `${activeLocation.locality}, ${activeLocation.city}`
              : activeLocation?.city}
          </h1>
          <p className="max-w-2xl text-sm text-[#44403C]">
            {catMeta?.cpcbGuidance ??
              'Current air-quality data could not be verified. Local indoor checklists and routine planning remain available.'}
          </p>
          {currentReading && (
            <p className="text-xs text-[#57534E]">
              Source: <strong>{currentReading.sourceName}</strong> • Timestamp:{' '}
              {new Date(currentReading.observationTime).toLocaleString()} • Standard: India NAQI
              (CPCB)
            </p>
          )}
        </div>

        <div
          className={`flex min-w-[220px] flex-col items-start justify-center rounded-2xl border-2 p-4 sm:items-end ${
            catMeta
              ? `${catMeta.badgeBgClass} ${catMeta.badgeTextClass} ${catMeta.borderClass}`
              : 'border-[#D6CCBA] bg-[#FAF7F2] text-[#1C1917]'
          }`}
        >
          <span className="text-xs font-bold tracking-wide uppercase">India NAQI</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-black tabular-nums">{aqiResult.value ?? 'N/A'}</span>
            <span className="text-lg font-extrabold">{aqiResult.category ?? 'Unavailable'}</span>
          </div>
          {aqiResult.dominantPollutant && (
            <p className="mt-1 text-xs font-semibold">
              Lead pollutant: {POLLUTANT_CATALOG[aqiResult.dominantPollutant].code} (
              {POLLUTANT_CATALOG[aqiResult.dominantPollutant].name})
            </p>
          )}
        </div>
      </div>

      {aqiResult.limitations.length > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#E4DCCD] bg-[#FAF7F2] p-3 text-xs text-[#57534E]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0F6E56]" aria-hidden="true" />
          <div>
            <span className="font-semibold text-[#1C1917]">Data transparency note: </span>
            {aqiResult.limitations.join(' ')}
          </div>
        </div>
      )}
    </Card>
  );
}
