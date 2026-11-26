import { Calculator, Info, Leaf, ShieldCheck } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { buildImpactExplanation, calculateTransportImpact } from '../../engines/impact-engine.ts';
import { generateDailyRoutine } from '../../engines/routine-engine.ts';
import { useAppStore } from '../../store/useAppStore.ts';
import { Badge, Card } from '../ui/Primitives.tsx';
import { EmissionFactorsTable } from './EmissionFactorsTable.tsx';

export function ImpactScreen() {
  const {
    householdProfile,
    aqiResult,
    forecast,
    routineStatuses,
    completedIndoorActionIds,
    impactHistory,
  } = useAppStore(
    useShallow((s) => ({
      householdProfile: s.householdProfile,
      aqiResult: s.aqiResult,
      forecast: s.forecast,
      routineStatuses: s.routineStatuses,
      completedIndoorActionIds: s.completedIndoorActionIds,
      impactHistory: s.impactHistory,
    })),
  );

  const routine = generateDailyRoutine(householdProfile, aqiResult, forecast);
  const completedRoutine = routine.filter((r) => routineStatuses[r.id] === 'completed');

  const sampleScenario = calculateTransportImpact({
    id: 'impact-preview',
    originalMode: householdProfile.primaryCommuteMode,
    alternativeMode: householdProfile.primaryCommuteMode === 'metro' ? 'remote' : 'metro',
    oneWayDistanceKm: Math.max(1, householdProfile.commuteDistanceKmOneWay),
    tripsPerWeek: 4,
  });
  const scenarioExp = buildImpactExplanation(sampleScenario, aqiResult);

  const totalCo2Avoided = impactHistory.reduce((s, e) => s + (e.co2eAvoidedKg ?? 0), 0);
  const totalTripsAvoided = impactHistory.reduce((s, e) => s + e.vehicleTripsAvoided, 0);

  return (
    <div className="space-y-5">
      <Card>
        <h1 className="text-ink text-2xl font-extrabold">Transparent Choice Impact Engine</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Saansathi strictly separates <strong>Personal Exposure Management</strong> from{' '}
          <strong>Environmental Emission Reductions</strong>. We never invent citywide AQI drops or
          derive PM2.5 savings blindly from CO₂e.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="border-brand/30 rounded-2xl border-2 bg-emerald-50/50 p-4">
            <div className="text-brand flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              <h2 className="text-base font-bold">1. Personal Exposure Management</h2>
            </div>
            <p className="text-ink mt-2 text-2xl font-black">
              {completedRoutine.length} routine + {completedIndoorActionIds.length} indoor actions
            </p>
            <p className="text-ink-body mt-1 text-xs">
              Qualitative exposure-reduction habits logged locally. Because inhaled dose depends on
              room infiltration, traffic proximity, and breathing rate, Saansathi avoids claiming a
              fabricated &quot;% disease risk reduction.&quot;
            </p>
          </div>

          <div className="border-amber-ink/30 rounded-2xl border-2 bg-amber-50/60 p-4">
            <div className="text-amber-ink flex items-center gap-2">
              <Leaf className="h-5 w-5" aria-hidden="true" />
              <h2 className="text-base font-bold">2. Illustrative Avoided Emissions</h2>
            </div>
            <p className="text-ink mt-2 text-2xl font-black">
              ~{totalCo2Avoided.toFixed(2)} kg CO₂e/wk{' '}
              <span className="text-ink-muted text-sm font-semibold">
                ({totalTripsAvoided} solo trips replaced)
              </span>
            </p>
            <p className="text-ink-body mt-1 text-xs">
              Calculated deterministically from logged transport shifts using documented Indian
              fleet emission factors. One household’s shift reduces fuel demand but does not
              measurably alter citywide AQI on its own.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <Calculator className="text-brand h-5 w-5" aria-hidden="true" />
          <h2 className="text-ink text-lg font-bold">
            How We Calculate Transport Impact ({scenarioExp.change})
          </h2>
        </div>
        <div className="text-ink-body mt-3 space-y-2 text-sm">
          <p>
            <strong>Estimated output (4 shifted trips/week):</strong>{' '}
            {scenarioExp.estimatedEnvironmentalImpact}
          </p>
          <p>
            <strong>Exposure implication:</strong> {scenarioExp.personalExposureConsideration}
          </p>
          <p>
            <strong>Confidence:</strong> {scenarioExp.confidenceSummary}
          </p>
        </div>

        <details className="border-border-warm bg-canvas text-ink-body mt-3 rounded-xl border p-3 text-xs">
          <summary className="text-ink cursor-pointer font-bold">
            How we calculated this (Assumptions & Limitations)
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {scenarioExp.howWeCalculated.map((a) => (
              <li key={a}>{a}</li>
            ))}
            {scenarioExp.limitations.map((l) => (
              <li key={l} className="text-ink-muted">
                Limitation: {l}
              </li>
            ))}
          </ul>
        </details>
      </Card>

      <Card>
        <h2 className="text-ink text-lg font-bold">Logged Choices History</h2>
        {impactHistory.length === 0 ? (
          <p className="text-ink-muted mt-2 flex items-center gap-1.5 text-sm">
            <Info className="h-4 w-4" aria-hidden="true" />
            No transport shifts logged yet. Visit Better Choices to log a weekly shift.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {impactHistory.map((entry) => (
              <div
                key={entry.id}
                className="border-border-warm bg-canvas flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-xs"
              >
                <div>
                  <p className="text-ink font-bold">{entry.title}</p>
                  <p className="text-ink-muted">{entry.exposureNote}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="border-amber-300 bg-amber-100 text-amber-950">
                    {entry.co2eAvoidedKg !== null
                      ? `~${entry.co2eAvoidedKg} kg CO₂e/wk`
                      : 'Qualitative'}
                  </Badge>
                  <Badge>{entry.confidence}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <EmissionFactorsTable />
    </div>
  );
}
