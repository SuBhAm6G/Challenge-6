import { Check, ChevronDown, Clock, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { SOURCE_BY_ID } from '../../data/sources.ts';
import { generateDailyRoutine } from '../../engines/routine-engine.ts';
import { useAppStore } from '../../store/useAppStore.ts';
import { Badge, Card } from '../ui/Primitives.tsx';

export function RoutineScreen() {
  const { householdProfile, aqiResult, forecast, routineStatuses, setRoutineStatus } = useAppStore(
    useShallow((s) => ({
      householdProfile: s.householdProfile,
      aqiResult: s.aqiResult,
      forecast: s.forecast,
      routineStatuses: s.routineStatuses,
      setRoutineStatus: s.setRoutineStatus,
    })),
  );
  const [swappedIds, setSwappedIds] = useState<Record<string, boolean>>({});
  const recommendations = generateDailyRoutine(householdProfile, aqiResult, forecast);

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-ink text-2xl font-extrabold">My Household Daily Routine</h1>
            <p className="text-ink-muted text-sm">
              Deterministic schedule plan for <strong>{householdProfile.name}</strong> (
              {householdProfile.primaryCommuteMode.replace(/_/g, ' ')},{' '}
              {householdProfile.commuteDistanceKmOneWay} km commute).
            </p>
          </div>
          <Badge className="border-emerald-300 bg-emerald-50 text-emerald-950">
            100% Deterministic Engine • Works Offline
          </Badge>
        </div>
      </Card>

      <div className="space-y-4">
        {recommendations.map((rec) => {
          const status = routineStatuses[rec.id] ?? rec.status;
          const useAlt = !!swappedIds[rec.id] && !!rec.alternative;
          const activeTitle = useAlt && rec.alternative ? rec.alternative.title : rec.title;
          const activeDesc =
            useAlt && rec.alternative ? rec.alternative.description : rec.description;

          return (
            <Card
              key={rec.id}
              className={
                status === 'dismissed'
                  ? 'opacity-65'
                  : status === 'completed'
                    ? 'border-brand bg-emerald-50/30'
                    : ''
              }
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-brand inline-flex items-center gap-1 text-xs font-bold uppercase">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {rec.suggestedTiming}
                    </span>
                    <Badge>{rec.relevantContext}</Badge>
                    <Badge>Confidence: {rec.confidence}</Badge>
                  </div>
                  <h2 className="text-ink text-lg font-bold">{activeTitle}</h2>
                  <p className="text-ink-body text-sm">{activeDesc}</p>
                  {useAlt && rec.alternative && (
                    <p className="text-amber-ink text-xs font-medium">
                      Trade-off: {rec.alternative.tradeOff}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={status === 'accepted'}
                    aria-label={`Accept: ${rec.title}`}
                    onClick={() =>
                      setRoutineStatus(rec.id, status === 'accepted' ? 'pending' : 'accepted')
                    }
                    className={`inline-flex min-h-[44px] items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                      status === 'accepted'
                        ? 'border-brand bg-emerald-100 text-emerald-950'
                        : 'border-border-strong bg-canvas text-ink hover:bg-hover-warm'
                    }`}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    aria-pressed={status === 'completed'}
                    aria-label={`${status === 'completed' ? 'Done' : 'Complete'}: ${rec.title}`}
                    onClick={() =>
                      setRoutineStatus(rec.id, status === 'completed' ? 'pending' : 'completed')
                    }
                    className={`inline-flex min-h-[44px] items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                      status === 'completed'
                        ? 'border-brand bg-brand text-white'
                        : 'border-border-strong bg-surface text-ink hover:bg-hover-warm'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {status === 'completed' ? 'Done' : 'Complete'}
                  </button>
                  {rec.alternative && (
                    <button
                      type="button"
                      aria-pressed={useAlt}
                      aria-label={`${useAlt ? 'Original' : 'Alternative'}: ${rec.title}`}
                      onClick={() =>
                        setSwappedIds((prev) => ({ ...prev, [rec.id]: !prev[rec.id] }))
                      }
                      className="border-border-strong bg-surface text-ink hover:bg-hover-warm inline-flex min-h-[44px] items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      {useAlt ? 'Original' : 'Alternative'}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-pressed={status === 'dismissed'}
                    onClick={() =>
                      setRoutineStatus(rec.id, status === 'dismissed' ? 'pending' : 'dismissed')
                    }
                    aria-label={`Dismiss ${rec.title}`}
                    className="border-border-strong bg-surface text-ink-muted inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold hover:bg-red-50 hover:text-red-700"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div className="bg-canvas rounded-xl p-3">
                  <strong className="text-brand">Personal Exposure Impact:</strong>{' '}
                  {rec.exposureEffect}
                </div>
                <div className="bg-canvas rounded-xl p-3">
                  <strong className="text-amber-ink">Environmental Emission Impact:</strong>{' '}
                  {rec.environmentalImpact}
                </div>
              </div>

              <details className="text-ink-muted mt-3 text-xs">
                <summary className="text-ink inline-flex cursor-pointer items-center gap-1 font-semibold">
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  Why recommended, caveats & evidence
                </summary>
                <div className="border-border-warm bg-canvas mt-2 space-y-1 rounded-xl border p-3">
                  <p>
                    <strong>Reasoning:</strong> {rec.reason}
                  </p>
                  <p>
                    <strong>Caveats:</strong> {rec.caveats.join(' ')}
                  </p>
                  <p>
                    <strong>References:</strong>{' '}
                    {rec.evidenceIds.map((id) => SOURCE_BY_ID.get(id)?.name ?? id).join(' • ')}
                  </p>
                </div>
              </details>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
