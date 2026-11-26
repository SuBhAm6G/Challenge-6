import { AlertTriangle, ArrowRight, Check, Leaf, Shield } from 'lucide-react';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { EMISSION_FACTOR_BY_MODE } from '../../data/emission-factors.ts';
import { type TransportMode, TransportModeSchema } from '../../domain/household/types.ts';
import { parseEnumValue } from '../../domain/select-guards.ts';
import { buildImpactExplanation, calculateTransportImpact } from '../../engines/impact-engine.ts';
import { useAppStore } from '../../store/useAppStore.ts';
import { Badge, Card, PrimaryButton } from '../ui/Primitives.tsx';
import { ZeroCostHabitsCard } from './ZeroCostHabitsCard.tsx';

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
  const { householdProfile, aqiResult, recordImpactEntry, setRoute } = useAppStore(
    useShallow((s) => ({
      householdProfile: s.householdProfile,
      aqiResult: s.aqiResult,
      recordImpactEntry: s.recordImpactEntry,
      setRoute: s.setRoute,
    })),
  );
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
        <h1 className="text-ink text-2xl font-extrabold">Better Choices & Trade-Off Explorer</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Compare practical low-emission travel and household alternatives. Saansathi checks both{' '}
          <strong>emissions avoided</strong> and <strong>personal smog exposure</strong> so
          recommendations never contradict each other.
        </p>

        <div className="border-border-warm bg-canvas mt-4 grid gap-4 rounded-2xl border p-4 sm:grid-cols-3">
          <div>
            <span className="text-ink-muted text-xs font-bold uppercase">Your baseline mode</span>
            <p className="text-ink mt-1 text-sm font-bold">
              {EMISSION_FACTOR_BY_MODE.get(householdProfile.primaryCommuteMode)?.label ??
                householdProfile.primaryCommuteMode}
            </p>
            <p className="text-ink-muted text-xs">
              {householdProfile.commuteDistanceKmOneWay} km one-way
            </p>
          </div>

          <label className="text-ink-body block text-xs font-semibold">
            Alternative to evaluate
            <select
              value={altMode}
              onChange={(e) =>
                setAltMode(parseEnumValue(TransportModeSchema, e.target.value, altMode))
              }
              className="border-border-strong bg-surface mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            >
              {ALTERNATIVE_MODES.map((m) => (
                <option key={m} value={m}>
                  {EMISSION_FACTOR_BY_MODE.get(m)?.label ?? m}
                </option>
              ))}
            </select>
          </label>

          <label className="text-ink-body block text-xs font-semibold">
            One-way trips shifted / week
            <input
              type="number"
              min={1}
              max={14}
              value={tripsPerWeek}
              onChange={(e) =>
                setTripsPerWeek(Math.max(1, Math.min(14, Number(e.target.value) || 1)))
              }
              className="border-border-strong bg-surface mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            />
          </label>
        </div>

        {isActiveExposureConflict && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3.5 text-sm text-red-950"
          >
            <AlertTriangle className="text-danger-ink mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
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
            <div className="text-brand flex items-center gap-2 text-sm font-bold">
              <Shield className="h-4 w-4" aria-hidden="true" />
              Personal Exposure Consideration
            </div>
            <p className="text-ink mt-2 text-sm">{explanation.personalExposureConsideration}</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="text-amber-ink flex items-center gap-2 text-sm font-bold">
              <Leaf className="h-4 w-4" aria-hidden="true" />
              Estimated Environmental Impact
            </div>
            <p className="text-ink mt-2 text-sm font-semibold">
              {explanation.estimatedEnvironmentalImpact}
            </p>
            <p className="text-ink-muted mt-1 text-xs">{explanation.confidenceSummary}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <PrimaryButton type="button" onClick={() => void handleLogChoice()}>
              {loggedId === calc.id + tripsPerWeek + altMode ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" /> Logged to Impact
                </>
              ) : (
                'Log This Weekly Shift to Impact'
              )}
            </PrimaryButton>
            <output aria-live="polite" className="sr-only">
              {loggedId === calc.id + tripsPerWeek + altMode
                ? 'Weekly commute shift saved to your impact history.'
                : ''}
            </output>
            <button
              type="button"
              onClick={() => setRoute('impact')}
              className="border-border-strong bg-surface text-ink hover:bg-hover-warm inline-flex min-h-[44px] items-center gap-1 rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              Inspect Impact Math <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <Badge>Factors: WRI India / India GHG Program</Badge>
        </div>
      </Card>

      <ZeroCostHabitsCard />
    </div>
  );
}
