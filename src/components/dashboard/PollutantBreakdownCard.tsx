import { INDIA_CATEGORY_BY_NAME } from '../../data/aqi-standards.ts';
import { POLLUTANT_CATALOG } from '../../data/pollutants.ts';
import type { PollutantSubIndex } from '../../domain/air-quality/types.ts';
import { Badge, Card } from '../ui/Primitives.tsx';

export function PollutantBreakdownCard({ subIndices }: { subIndices: PollutantSubIndex[] }) {
  return (
    <Card>
      <h2 className="text-ink text-lg font-bold">Pollutant Breakdown</h2>
      <p className="text-ink-muted mb-3 text-xs">
        Each pollutant has distinct sources and household implications—never treated identically.
      </p>
      {subIndices.length === 0 ? (
        <p className="text-ink-muted text-sm">No pollutant concentrations available.</p>
      ) : (
        <div className="space-y-2">
          {subIndices.map((sub) => {
            const info = POLLUTANT_CATALOG[sub.pollutant];
            const meta = INDIA_CATEGORY_BY_NAME.get(sub.category);
            return (
              <details
                key={sub.pollutant}
                className="border-border-warm bg-canvas rounded-xl border p-3"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                  <div>
                    <span className="text-ink text-sm font-bold">
                      {info.code} — {info.name}
                    </span>
                    <span className="text-ink-muted ml-2 text-xs">
                      {sub.concentration} {sub.unit}
                    </span>
                  </div>
                  <Badge
                    className={
                      meta ? `${meta.badgeBgClass} ${meta.badgeTextClass} ${meta.borderClass}` : ''
                    }
                  >
                    Sub-index {sub.subIndex} ({sub.category})
                  </Badge>
                </summary>
                <div className="border-border-warm text-ink-body mt-2 space-y-1 border-t pt-2 text-xs">
                  <p>
                    <strong>What it is:</strong> {info.whatItIs}
                  </p>
                  <p>
                    <strong>Common sources:</strong> {info.commonUrbanSources}
                  </p>
                  <p>
                    <strong>Why it matters:</strong> {info.whyItMatters}
                  </p>
                  <p>
                    <strong>Indoor note:</strong> {info.indoorNote}
                  </p>
                  {sub.averagingPeriodWarning && (
                    <p className="text-amber-ink font-medium">{sub.averagingPeriodWarning}.</p>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </Card>
  );
}
