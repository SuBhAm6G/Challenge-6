import { AlertTriangle, ArrowRight, Check, Leaf, Shield } from 'lucide-react';
import { useState } from 'react';
import { EMISSION_FACTOR_BY_MODE } from '../../data/emission-factors.ts';
import type { TransportMode } from '../../domain/household/types.ts';
import { buildImpactExplanation, calculateTransportImpact } from '../../engines/impact-engine.ts';
import { useAppStore } from '../../store/useAppStore.ts';
import { Badge, Card, PrimaryButton } from '../ui/Primitives.tsx';

const ALTERNATIVE_MODES: readonly TransportMode[] = [
  'metro',
  'bus',
  'carpool',
  'remote',
  'auto_cng',
  'bicycle',
  'walking',
];

export function ChoicesScreen() {
  const { householdProfile, aqiResult, recordImpactEntry, setRoute } = useAppStore();
  const [altMode, setAltMode] = useState<TransportMode>('metro');
  const [tripsPerWeek, setTripsPerWeek] = useState<number>(4);
  const [loggedId, setLoggedId] = useState<string | null>(null);

  const calc = calculateTransportImpact({
    id: `choice-${householdProfile.primaryCommuteMode}-${altMode}`,
    originalMode: householdProfile.primaryCommuteMode,
    alternativeMode: altMode,
    oneWayDistanceKm: Math.max(1, householdProfile.commuteDistanceKmOneWay),
    tripsPerWeek,
  });
  const explanation = buildImpactExplanation(calc, aqiResult);
  const aqiVal = aqiResult.value ?? 0;
  const isActiveExposureConflict = (altMode === 'bicycle' || altMode === 'walking') && aqiVal > 200;

  const handleLogChoice = async () => {
    await recordImpactEntry({
      id: `imp-${Date.now()}`,
      dateIso: new Date().toISOString(),
      impactType: 'transport_emissions',
      title: `${explanation.change} (${householdProfile.commuteDistanceKmOneWay} km × ${tripsPerWeek}/wk)`,
      exposureNote: explanation.personalExposureConsideration,
      co2eAvoidedKg: calc.co2eAvoidedKgPerWeek,
      vehicleTripsAvoided: calc.tripsAvoidedPerWeek,
      confidence: calc.confidence,
    });
    setLoggedId(calc.id + tripsPerWeek + altMode);
  };

  return (
    <div className="space-y-5">
      <Card>
        <h1 className="text-2xl font-extrabold text-[#1C1917]">
          Better Choices & Trade-Off Explorer
        </h1>
        <p className="mt-1 text-sm text-[#57534E]">
          Compare practical low-emission travel and household alternatives. Saansathi checks both{' '}
          <strong>emissions avoided</strong> and <strong>personal smog exposure</strong> so
          recommendations never contradict each other.
        </p>

        <div className="mt-4 grid gap-4 rounded-2xl border border-[#E4DCCD] bg-[#FAF7F2] p-4 sm:grid-cols-3">
          <div>
            <span className="text-xs font-bold text-[#57534E] uppercase">Your baseline mode</span>
            <p className="mt-1 text-sm font-bold text-[#1C1917]">
              {EMISSION_FACTOR_BY_MODE.get(householdProfile.primaryCommuteMode)?.label ??
                householdProfile.primaryCommuteMode}
            </p>
            <p className="text-xs text-[#57534E]">
              {householdProfile.commuteDistanceKmOneWay} km one-way
            </p>
          </div>

          <label className="block text-xs font-semibold text-[#44403C]">
            Alternative to evaluate
            <select
              value={altMode}
              onChange={(e) => setAltMode(e.target.value as TransportMode)}
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-white px-3 py-2 text-sm"
            >
              {ALTERNATIVE_MODES.map((m) => (
                <option key={m} value={m}>
                  {EMISSION_FACTOR_BY_MODE.get(m)?.label ?? m}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold text-[#44403C]">
            One-way trips shifted / week
            <input
              type="number"
              min={1}
              max={14}
              value={tripsPerWeek}
              onChange={(e) =>
                setTripsPerWeek(Math.max(1, Math.min(14, Number(e.target.value) || 1)))
              }
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        {isActiveExposureConflict && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3.5 text-sm text-red-950"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#B91C1C]" aria-hidden="true" />
            <div>
              <strong>Exposure vs. Emission Trade-off Warning:</strong> Although{' '}
              {EMISSION_FACTOR_BY_MODE.get(altMode)?.label} produces zero tailpipe emissions,
              current India NAQI is{' '}
              <strong>
                {aqiVal} ({aqiResult.category})
              </strong>
              . Prolonged active travel along traffic corridors increases breathing rate and
              particulate intake. Prefer enclosed Metro, Bus, or remote work today.
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0F6E56]">
              <Shield className="h-4 w-4" aria-hidden="true" />
              Personal Exposure Consideration
            </div>
            <p className="mt-2 text-sm text-[#1C1917]">
              {explanation.personalExposureConsideration}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#B45309]">
              <Leaf className="h-4 w-4" aria-hidden="true" />
              Estimated Environmental Impact
            </div>
            <p className="mt-2 text-sm font-semibold text-[#1C1917]">
              {explanation.estimatedEnvironmentalImpact}
            </p>
            <p className="mt-1 text-xs text-[#57534E]">{explanation.confidenceSummary}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <PrimaryButton type="button" onClick={handleLogChoice}>
              {loggedId === calc.id + tripsPerWeek + altMode ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" /> Logged to Impact
                </>
              ) : (
                'Log This Weekly Shift to Impact'
              )}
            </PrimaryButton>
            <button
              type="button"
              onClick={() => setRoute('impact')}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#D6CCBA] bg-white px-4 py-2 text-sm font-semibold text-[#1C1917] hover:bg-[#EFE8DA]"
            >
              Inspect Impact Math <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <Badge>Factors: WRI India / India GHG Program</Badge>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-[#1C1917]">Zero-Cost Low-Emission Daily Habits</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E4DCCD] bg-[#FAF7F2] p-3.5 text-sm">
            <h3 className="font-bold text-[#1C1917]">Stop idling at signals & gates</h3>
            <p className="mt-1 text-xs text-[#44403C]">
              Switching off engines for stops longer than 15–20 seconds cuts needless fuel burn and
              concentrated exhaust near pedestrians and school gates.
            </p>
          </div>
          <div className="rounded-xl border border-[#E4DCCD] bg-[#FAF7F2] p-3.5 text-sm">
            <h3 className="font-bold text-[#1C1917]">Consolidate cold-start errands</h3>
            <p className="mt-1 text-xs text-[#44403C]">
              Catalytic converters work poorly in the first few minutes of a cold engine. Batching 3
              short errands into 1 warm-engine loop saves fuel and tailpipe emissions.
            </p>
          </div>
          <div className="rounded-xl border border-[#E4DCCD] bg-[#FAF7F2] p-3.5 text-sm">
            <h3 className="font-bold text-[#1C1917]">Zero open waste or leaf burning</h3>
            <p className="mt-1 text-xs text-[#44403C]">
              Composting garden leaves and reporting municipal waste fires prevents intense local
              smoke spikes that travel directly into nearby homes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
