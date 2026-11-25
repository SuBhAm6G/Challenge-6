import { Calculator, ExternalLink, Info, Leaf, ShieldCheck } from 'lucide-react';
import { INDIA_EMISSION_FACTORS } from '../../data/emission-factors.ts';
import { buildImpactExplanation, calculateTransportImpact } from '../../engines/impact-engine.ts';
import { generateDailyRoutine } from '../../engines/routine-engine.ts';
import { useAppStore } from '../../store/useAppStore.ts';
import { Badge, Card } from '../ui/Primitives.tsx';

export function ImpactScreen() {
  const {
    householdProfile,
    aqiResult,
    forecast,
    routineStatuses,
    completedIndoorActionIds,
    impactHistory,
  } = useAppStore();

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
        <h1 className="text-2xl font-extrabold text-[#1C1917]">Transparent Choice Impact Engine</h1>
        <p className="mt-1 text-sm text-[#57534E]">
          Saansathi strictly separates <strong>Personal Exposure Management</strong> from{' '}
          <strong>Environmental Emission Reductions</strong>. We never invent citywide AQI drops or
          derive PM2.5 savings blindly from CO₂e.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-[#0F6E56]/30 bg-emerald-50/50 p-4">
            <div className="flex items-center gap-2 text-[#0F6E56]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              <h2 className="text-base font-bold">1. Personal Exposure Management</h2>
            </div>
            <p className="mt-2 text-2xl font-black text-[#1C1917]">
              {completedRoutine.length} routine + {completedIndoorActionIds.length} indoor actions
            </p>
            <p className="mt-1 text-xs text-[#44403C]">
              Qualitative exposure-reduction habits logged locally. Because inhaled dose depends on
              room infiltration, traffic proximity, and breathing rate, Saansathi avoids claiming a
              fabricated "% disease risk reduction."
            </p>
          </div>

          <div className="rounded-2xl border-2 border-[#B45309]/30 bg-amber-50/60 p-4">
            <div className="flex items-center gap-2 text-[#B45309]">
              <Leaf className="h-5 w-5" aria-hidden="true" />
              <h2 className="text-base font-bold">2. Illustrative Avoided Emissions</h2>
            </div>
            <p className="mt-2 text-2xl font-black text-[#1C1917]">
              ~{totalCo2Avoided.toFixed(2)} kg CO₂e/wk{' '}
              <span className="text-sm font-semibold text-[#57534E]">
                ({totalTripsAvoided} solo trips replaced)
              </span>
            </p>
            <p className="mt-1 text-xs text-[#44403C]">
              Calculated deterministically from logged transport shifts using documented Indian
              fleet emission factors. One household’s shift reduces fuel demand but does not
              measurably alter citywide AQI on its own.
            </p>
          </div>
        </div>
      </Card>

      {/* How we calculated this disclosure */}
      <Card>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-[#0F6E56]" aria-hidden="true" />
          <h2 className="text-lg font-bold text-[#1C1917]">
            How We Calculate Transport Impact ({scenarioExp.change})
          </h2>
        </div>
        <div className="mt-3 space-y-2 text-sm text-[#44403C]">
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

        <details className="mt-3 rounded-xl border border-[#E4DCCD] bg-[#FAF7F2] p-3 text-xs text-[#44403C]">
          <summary className="cursor-pointer font-bold text-[#1C1917]">
            How we calculated this (Assumptions & Limitations)
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {scenarioExp.howWeCalculated.map((a) => (
              <li key={a}>{a}</li>
            ))}
            {scenarioExp.limitations.map((l) => (
              <li key={l} className="text-[#57534E]">
                Limitation: {l}
              </li>
            ))}
          </ul>
        </details>
      </Card>

      {/* Logged History */}
      <Card>
        <h2 className="text-lg font-bold text-[#1C1917]">Logged Choices History</h2>
        {impactHistory.length === 0 ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-[#57534E]">
            <Info className="h-4 w-4" aria-hidden="true" />
            No transport shifts logged yet. Visit Better Choices to log a weekly shift.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {impactHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E4DCCD] bg-[#FAF7F2] p-3 text-xs"
              >
                <div>
                  <p className="font-bold text-[#1C1917]">{entry.title}</p>
                  <p className="text-[#57534E]">{entry.exposureNote}</p>
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

      {/* Emission Factor Provenance Table */}
      <Card>
        <h2 className="text-lg font-bold text-[#1C1917]">
          Documented Indian Emission Factors Registry
        </h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-[#E4DCCD]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F3EDE2] text-[#1C1917]">
              <tr>
                <th className="px-3 py-2 font-semibold">Mode</th>
                <th className="px-3 py-2 font-semibold">CO₂e (g/pkm)</th>
                <th className="px-3 py-2 font-semibold">PM2.5 (mg/pkm)</th>
                <th className="px-3 py-2 font-semibold">NOₓ (mg/pkm)</th>
                <th className="px-3 py-2 font-semibold">Source & Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4DCCD] bg-white">
              {INDIA_EMISSION_FACTORS.map((f) => (
                <tr key={f.id}>
                  <td className="px-3 py-2 font-semibold">{f.label}</td>
                  <td className="px-3 py-2">{f.co2eGramsPerPassengerKm}</td>
                  <td className="px-3 py-2">{f.pm25MgPerPassengerKm ?? 'Omitted (varies)'}</td>
                  <td className="px-3 py-2">{f.noxMgPerPassengerKm ?? 'Omitted (varies)'}</td>
                  <td className="px-3 py-2">
                    <a
                      href={f.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#0F6E56] underline"
                    >
                      {f.region} ({f.publicationYear})
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
