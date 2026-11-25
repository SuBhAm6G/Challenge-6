import { AlertTriangle, CheckCircle2, ShieldAlert, Wind } from 'lucide-react';
import { SOURCE_BY_ID } from '../../data/sources.ts';
import type { BudgetLevel } from '../../domain/household/types.ts';
import type { CookingFuel, IndoorBurningSource } from '../../domain/indoor/types.ts';
import { evaluateVentilationGuidance, generateIndoorActions } from '../../engines/indoor-engine.ts';
import { useAppStore } from '../../store/useAppStore.ts';
import { Badge, Card } from '../ui/Primitives.tsx';

const BURNING_OPTIONS: readonly { id: IndoorBurningSource; label: string }[] = [
  { id: 'incense_agarbatti', label: 'Incense / Agarbatti / Dhoop' },
  { id: 'mosquito_coils', label: 'Mosquito Coils' },
  { id: 'candles_diyas', label: 'Candles / Diyas' },
  { id: 'tobacco_vaping', label: 'Smoking / Vaping indoors' },
];

export function IndoorScreen() {
  const {
    indoorProfile,
    aqiResult,
    forecast,
    completedIndoorActionIds,
    updateIndoorProfile,
    toggleIndoorAction,
  } = useAppStore();

  const ventilation = evaluateVentilationGuidance(indoorProfile, aqiResult, forecast);
  const actions = generateIndoorActions(indoorProfile, aqiResult);

  const toggleBurning = (src: IndoorBurningSource) => {
    const exists = indoorProfile.burningSources.includes(src);
    updateIndoorProfile({
      ...indoorProfile,
      burningSources: exists
        ? indoorProfile.burningSources.filter((s) => s !== src)
        : [...indoorProfile.burningSources, src],
    });
  };

  return (
    <div className="space-y-5">
      {/* Header + Ventilation Advisor */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1C1917]">Indoor Air-Quality Toolkit</h1>
            <p className="text-sm text-[#57534E]">
              Practical, budget-sensitive source control, safe ventilation timing, and evidence-only
              filtration guidance.
            </p>
          </div>
          <Badge className="border-emerald-300 bg-emerald-50 text-emerald-950">
            Zero Ozone Generators • Zero Unproven Myths
          </Badge>
        </div>

        <div className="mt-4 rounded-2xl border border-[#D6CCBA] bg-[#FAF7F2] p-4">
          <div className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-[#0F6E56]" aria-hidden="true" />
            <h2 className="text-base font-bold text-[#1C1917]">
              Ventilation Intelligence: {ventilation.headline}
            </h2>
          </div>
          <p className="mt-1.5 text-sm text-[#44403C]">{ventilation.explanation}</p>
          {ventilation.recommendedWindowText && (
            <p className="mt-1.5 text-sm font-semibold text-[#0F6E56]">
              {ventilation.recommendedWindowText}
            </p>
          )}
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{ventilation.combustionSafetyWarning}</span>
          </div>
        </div>
      </Card>

      {/* Optional Indoor Setup */}
      <Card>
        <h2 className="text-lg font-bold text-[#1C1917]">Your Home Setup (Optional)</h2>
        <p className="mb-3 text-xs text-[#57534E]">
          All fields are optional and stored only on this device. Adjust any setting to reprioritize
          your indoor action cards immediately.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-semibold text-[#44403C]">
            Primary cooking fuel
            <select
              value={indoorProfile.cookingFuel}
              onChange={(e) =>
                updateIndoorProfile({
                  ...indoorProfile,
                  cookingFuel: e.target.value as CookingFuel,
                })
              }
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-[#FAF7F2] px-3 py-2 text-sm"
            >
              <option value="lpg_gas">LPG Cylinder Gas</option>
              <option value="piped_gas">Piped Natural Gas (PNG)</option>
              <option value="electric_induction">Electric / Induction</option>
              <option value="biomass">Wood / Biomass / Coal</option>
              <option value="mixed">Mixed fuels</option>
            </select>
          </label>

          <label className="block text-xs font-semibold text-[#44403C]">
            Improvement budget
            <select
              value={indoorProfile.budget}
              onChange={(e) =>
                updateIndoorProfile({ ...indoorProfile, budget: e.target.value as BudgetLevel })
              }
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-[#FAF7F2] px-3 py-2 text-sm"
            >
              <option value="zero_cost">Zero cost only</option>
              <option value="low">Low cost</option>
              <option value="moderate">Moderate</option>
              <option value="flexible">Flexible</option>
            </select>
          </label>

          <div className="flex flex-col justify-end gap-2 text-xs font-semibold text-[#1C1917]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={indoorProfile.hasAirPurifier}
                onChange={(e) =>
                  updateIndoorProfile({ ...indoorProfile, hasAirPurifier: e.target.checked })
                }
                className="h-4 w-4 accent-[#0F6E56]"
              />
              We have a HEPA air purifier
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={indoorProfile.hasKitchenExhaustOrChimney}
                onChange={(e) =>
                  updateIndoorProfile({
                    ...indoorProfile,
                    hasKitchenExhaustOrChimney: e.target.checked,
                  })
                }
                className="h-4 w-4 accent-[#0F6E56]"
              />
              Kitchen has exhaust fan or chimney
            </label>
          </div>
        </div>

        <fieldset className="mt-4 rounded-xl border border-[#E4DCCD] bg-[#FAF7F2] p-3">
          <legend className="px-1 text-xs font-bold text-[#44403C]">
            Indoor burning or smoke sources present in the home
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {BURNING_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={indoorProfile.burningSources.includes(opt.id)}
                  onChange={() => toggleBurning(opt.id)}
                  className="h-4 w-4 accent-[#0F6E56]"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      {/* Action Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((action) => {
          const isDone = completedIndoorActionIds.includes(action.id);
          return (
            <Card key={action.id} className={isDone ? 'border-[#0F6E56] bg-emerald-50/35' : ''}>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      className={
                        action.priority === 'high'
                          ? 'border-orange-300 bg-orange-100 text-orange-950'
                          : 'border-[#E4DCCD] bg-[#FAF7F2] text-[#44403C]'
                      }
                    >
                      {action.priority.toUpperCase()} PRIORITY
                    </Badge>
                    <Badge>{action.costEffort}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-[#1C1917]">{action.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => toggleIndoorAction(action.id)}
                  aria-pressed={isDone}
                  className={`inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                    isDone
                      ? 'border-[#0F6E56] bg-[#0F6E56] text-white'
                      : 'border-[#D6CCBA] bg-white text-[#1C1917] hover:bg-[#EFE8DA]'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {isDone ? 'Checked' : 'Check off'}
                </button>
              </div>

              <p className="mt-2 text-sm text-[#44403C]">{action.whatToDo}</p>
              <div className="mt-3 space-y-1.5 rounded-xl bg-[#FAF7F2] p-3 text-xs text-[#44403C]">
                <p>
                  <strong>Why it helps:</strong> {action.whyItHelps}
                </p>
                <p>
                  <strong>Limitations:</strong> {action.limitations}
                </p>
                <p className="flex items-start gap-1.5 font-medium text-[#B45309]">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{action.safetyNote}</span>
                </p>
                <p className="text-[11px] text-[#57534E]">
                  Evidence:{' '}
                  {action.evidenceIds.map((id) => SOURCE_BY_ID.get(id)?.name ?? id).join(' • ')}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
