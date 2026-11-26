import { ArrowRight } from 'lucide-react';
import type { RecommendationStatus, RoutineRecommendation } from '../../domain/routine/types.ts';
import { Card, SecondaryButton } from '../ui/Primitives.tsx';

export function HomeRoutinePreviewCard({
  householdName,
  routine,
  routineStatuses,
  onOpenTimeline,
  onToggleStatus,
}: {
  householdName: string;
  routine: RoutineRecommendation[];
  routineStatuses: Record<string, RecommendationStatus>;
  onOpenTimeline: () => void;
  onToggleStatus: (recId: string, next: RecommendationStatus) => void;
}) {
  return (
    <Card className="lg:col-span-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-ink text-lg font-bold">
            Today’s Priority Actions for {householdName}
          </h2>
          <p className="text-ink-muted text-xs">
            Deterministic context engine • Adapted to your commute, schedule, and protection
            settings
          </p>
        </div>
        <SecondaryButton type="button" onClick={onOpenTimeline}>
          Full Timeline <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </SecondaryButton>
      </div>

      <div className="mt-4 space-y-3">
        {routine.slice(0, 3).map((rec) => {
          const status = routineStatuses[rec.id] ?? rec.status;
          return (
            <div key={rec.id} className="border-border-warm bg-canvas rounded-xl border p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-brand text-xs font-bold tracking-wide uppercase">
                    {rec.suggestedTiming}
                  </span>
                  <h3 className="text-ink text-sm font-bold sm:text-base">{rec.title}</h3>
                </div>
                <button
                  type="button"
                  aria-pressed={status === 'completed'}
                  aria-label={`${status === 'completed' ? 'Completed' : 'Mark Done'}: ${rec.title}`}
                  onClick={() =>
                    onToggleStatus(rec.id, status === 'completed' ? 'pending' : 'completed')
                  }
                  className={`min-h-[44px] rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    status === 'completed'
                      ? 'border-brand bg-brand text-white'
                      : 'border-border-strong bg-surface text-ink hover:bg-hover-warm'
                  }`}
                >
                  {status === 'completed' ? 'Completed' : 'Mark Done'}
                </button>
              </div>
              <p className="text-ink-body mt-1.5 text-sm">{rec.description}</p>
              <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                <div className="bg-surface text-ink rounded-lg p-2">
                  <strong className="text-brand">Exposure:</strong> {rec.exposureEffect}
                </div>
                <div className="bg-surface text-ink rounded-lg p-2">
                  <strong className="text-amber-ink">Emissions:</strong> {rec.environmentalImpact}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
