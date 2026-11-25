import { INDIA_CATEGORY_BY_NAME } from '../../data/aqi-standards.ts';
import { POLLUTANT_CATALOG } from '../../data/pollutants.ts';
import type { PollutantSubIndex } from '../../domain/air-quality/types.ts';
import { Badge, Card } from '../ui/Primitives.tsx';

export function PollutantBreakdownCard({ subIndices }: { subIndices: PollutantSubIndex[] }) {
  return (
    <Card>
      <h2 className="text-lg font-bold text-[#1C1917]">Pollutant Breakdown</h2>
      <p className="mb-3 text-xs text-[#57534E]">
        Each pollutant has distinct sources and household implications—never treated identically.
      </p>
      {subIndices.length === 0 ? (
        <p className="text-sm text-[#57534E]">No pollutant concentrations available.</p>
      ) : (
        <div className="space-y-2">
          {subIndices.map((sub) => {
            const info = POLLUTANT_CATALOG[sub.pollutant];
            const meta = INDIA_CATEGORY_BY_NAME.get(sub.category);
            return (
              <details
                key={sub.pollutant}
                className="rounded-xl border border-[#E4DCCD] bg-[#FAF7F2] p-3"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-bold text-[#1C1917]">
                      {info.code} — {info.name}
                    </span>
                    <span className="ml-2 text-xs text-[#57534E]">
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
                <div className="mt-2 space-y-1 border-t border-[#E4DCCD] pt-2 text-xs text-[#44403C]">
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
                    <p className="font-medium text-[#B45309]">{sub.averagingPeriodWarning}.</p>
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
