import { Check, ChevronDown, Clock, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { SOURCE_BY_ID } from '../../data/sources.ts';
import { generateDailyRoutine } from '../../engines/routine-engine.ts';
import { useAppStore } from '../../store/useAppStore.ts';
import { Badge, Card } from '../ui/Primitives.tsx';

export function RoutineScreen() {
  const { householdProfile, aqiResult, forecast, routineStatuses, setRoutineStatus } =
    useAppStore();
  const [swappedIds, setSwappedIds] = useState<Record<string, boolean>>({});
  const recommendations = generateDailyRoutine(householdProfile, aqiResult, forecast);

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1C1917]">My Household Daily Routine</h1>
            <p className="text-sm text-[#57534E]">
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
                    ? 'border-[#0F6E56] bg-emerald-50/30'
                    : ''
              }
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0F6E56] uppercase">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {rec.suggestedTiming}
                    </span>
                    <Badge>{rec.relevantContext}</Badge>
                    <Badge>Confidence: {rec.confidence}</Badge>
                  </div>
                  <h2 className="text-lg font-bold text-[#1C1917]">{activeTitle}</h2>
                  <p className="text-sm text-[#44403C]">{activeDesc}</p>
                  {useAlt && rec.alternative && (
                    <p className="text-xs font-medium text-[#B45309]">
                      Trade-off: {rec.alternative.tradeOff}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setRoutineStatus(rec.id, status === 'accepted' ? 'pending' : 'accepted')
                    }
                    className={`inline-flex min-h-[38px] items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                      status === 'accepted'
                        ? 'border-[#0F6E56] bg-emerald-100 text-emerald-950'
                        : 'border-[#D6CCBA] bg-[#FAF7F2] text-[#1C1917] hover:bg-[#EFE8DA]'
                    }`}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRoutineStatus(rec.id, status === 'completed' ? 'pending' : 'completed')
                    }
                    className={`inline-flex min-h-[38px] items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                      status === 'completed'
                        ? 'border-[#0F6E56] bg-[#0F6E56] text-white'
                        : 'border-[#D6CCBA] bg-white text-[#1C1917] hover:bg-[#EFE8DA]'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {status === 'completed' ? 'Done' : 'Complete'}
                  </button>
                  {rec.alternative && (
                    <button
                      type="button"
                      onClick={() =>
                        setSwappedIds((prev) => ({ ...prev, [rec.id]: !prev[rec.id] }))
                      }
                      className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[#D6CCBA] bg-white px-3 py-1.5 text-xs font-semibold text-[#1C1917] hover:bg-[#EFE8DA]"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      {useAlt ? 'Original' : 'Alternative'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setRoutineStatus(rec.id, status === 'dismissed' ? 'pending' : 'dismissed')
                    }
                    aria-label={`Dismiss ${rec.title}`}
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[#D6CCBA] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#57534E] hover:bg-red-50 hover:text-red-700"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div className="rounded-xl bg-[#FAF7F2] p-3">
                  <strong className="text-[#0F6E56]">Personal Exposure Impact:</strong>{' '}
                  {rec.exposureEffect}
                </div>
                <div className="rounded-xl bg-[#FAF7F2] p-3">
                  <strong className="text-[#B45309]">Environmental Emission Impact:</strong>{' '}
                  {rec.environmentalImpact}
                </div>
              </div>

              <details className="mt-3 text-xs text-[#57534E]">
                <summary className="inline-flex cursor-pointer items-center gap-1 font-semibold text-[#1C1917]">
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  Why recommended, caveats & evidence
                </summary>
                <div className="mt-2 space-y-1 rounded-xl border border-[#E4DCCD] bg-[#FAF7F2] p-3">
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
