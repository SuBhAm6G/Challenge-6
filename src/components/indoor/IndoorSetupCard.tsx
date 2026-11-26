import { BudgetLevelSchema } from '../../domain/household/types.ts';
import {
  CookingFuelSchema,
  type IndoorBurningSource,
  type IndoorProfile,
} from '../../domain/indoor/types.ts';
import { parseEnumValue } from '../../domain/select-guards.ts';
import { Card } from '../ui/Primitives.tsx';

const BURNING_OPTIONS: readonly { id: IndoorBurningSource; label: string }[] = [
  { id: 'incense_agarbatti', label: 'Incense / Agarbatti / Dhoop' },
  { id: 'mosquito_coils', label: 'Mosquito Coils' },
  { id: 'candles_diyas', label: 'Candles / Diyas' },
  { id: 'tobacco_vaping', label: 'Smoking / Vaping indoors' },
];

export function IndoorSetupCard({
  indoorProfile,
  onUpdate,
}: {
  indoorProfile: IndoorProfile;
  onUpdate: (next: IndoorProfile) => void;
}) {
  const toggleBurning = (src: IndoorBurningSource) => {
    const exists = indoorProfile.burningSources.includes(src);
    onUpdate({
      ...indoorProfile,
      burningSources: exists
        ? indoorProfile.burningSources.filter((s) => s !== src)
        : [...indoorProfile.burningSources, src],
    });
  };

  return (
    <Card>
      <h2 className="text-ink text-lg font-bold">Your Home Setup (Optional)</h2>
      <p className="text-ink-muted mb-3 text-xs">
        All fields are optional and stored only on this device. Adjust any setting to reprioritize
        your indoor action cards immediately.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-ink-body block text-xs font-semibold">
          Primary cooking fuel
          <select
            value={indoorProfile.cookingFuel}
            onChange={(e) =>
              onUpdate({
                ...indoorProfile,
                cookingFuel: parseEnumValue(
                  CookingFuelSchema,
                  e.target.value,
                  indoorProfile.cookingFuel,
                ),
              })
            }
            className="border-border-strong bg-canvas mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          >
            <option value="lpg_gas">LPG Cylinder Gas</option>
            <option value="piped_gas">Piped Natural Gas (PNG)</option>
            <option value="electric_induction">Electric / Induction</option>
            <option value="biomass">Wood / Biomass / Coal</option>
            <option value="mixed">Mixed fuels</option>
          </select>
        </label>

        <label className="text-ink-body block text-xs font-semibold">
          Improvement budget
          <select
            value={indoorProfile.budget}
            onChange={(e) =>
              onUpdate({
                ...indoorProfile,
                budget: parseEnumValue(BudgetLevelSchema, e.target.value, indoorProfile.budget),
              })
            }
            className="border-border-strong bg-canvas mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          >
            <option value="zero_cost">Zero cost only</option>
            <option value="low">Low cost</option>
            <option value="moderate">Moderate</option>
            <option value="flexible">Flexible</option>
          </select>
        </label>

        <div className="text-ink flex flex-col justify-end gap-2 text-xs font-semibold">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={indoorProfile.hasAirPurifier}
              onChange={(e) => onUpdate({ ...indoorProfile, hasAirPurifier: e.target.checked })}
              className="accent-brand h-4 w-4"
            />
            We have a HEPA air purifier
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={indoorProfile.hasKitchenExhaustOrChimney}
              onChange={(e) =>
                onUpdate({ ...indoorProfile, hasKitchenExhaustOrChimney: e.target.checked })
              }
              className="accent-brand h-4 w-4"
            />
            Kitchen has exhaust fan or chimney
          </label>
        </div>
      </div>

      <fieldset className="border-border-warm bg-canvas mt-4 rounded-xl border p-3">
        <legend className="text-ink-body px-1 text-xs font-bold">
          Indoor burning or smoke sources present in the home
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {BURNING_OPTIONS.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 text-xs font-medium">
              <input
                type="checkbox"
                checked={indoorProfile.burningSources.includes(opt.id)}
                onChange={() => toggleBurning(opt.id)}
                className="accent-brand h-4 w-4"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>
    </Card>
  );
}
