import {
  type HouseholdProfile,
  TransportModeSchema,
  type VulnerabilityFlag,
} from '../../domain/household/types.ts';
import { parseEnumValue } from '../../domain/select-guards.ts';
import { HouseholdScheduleSelects } from './HouseholdScheduleSelects.tsx';

const PROTECTION_OPTIONS: readonly { id: VulnerabilityFlag; label: string }[] = [
  { id: 'children', label: 'Young or school-going children' },
  { id: 'older_adults', label: 'Older adults (60+)' },
  { id: 'pregnant', label: 'Pregnant household member' },
  { id: 'respiratory_or_heart', label: 'Sensitive breathing or heart comfort needs' },
];

const INPUT_CLASS =
  'mt-1 w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm';

export function HouseholdFormFields({
  draft,
  onChange,
}: {
  draft: HouseholdProfile;
  onChange: (next: HouseholdProfile) => void;
}) {
  const toggleFlag = (flag: VulnerabilityFlag) => {
    const exists = draft.protectionFlags.includes(flag);
    onChange({
      ...draft,
      protectionFlags: exists
        ? draft.protectionFlags.filter((f) => f !== flag)
        : [...draft.protectionFlags, flag],
    });
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-ink-body block text-xs font-semibold">
          Household label
          <input
            type="text"
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            required
            maxLength={60}
            className={INPUT_CLASS}
          />
        </label>
        <label className="text-ink-body block text-xs font-semibold">
          Household size
          <input
            type="number"
            min={1}
            max={20}
            value={draft.memberCount}
            onChange={(e) =>
              onChange({ ...draft, memberCount: Math.max(1, Number(e.target.value) || 1) })
            }
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-ink-body block text-xs font-semibold">
          Main commute mode
          <select
            value={draft.primaryCommuteMode}
            onChange={(e) =>
              onChange({
                ...draft,
                primaryCommuteMode: parseEnumValue(
                  TransportModeSchema,
                  e.target.value,
                  draft.primaryCommuteMode,
                ),
              })
            }
            className={INPUT_CLASS}
          >
            <option value="car_petrol">Petrol Car (solo)</option>
            <option value="car_diesel">Diesel Car (solo)</option>
            <option value="car_cng">CNG Car</option>
            <option value="car_ev">Electric Car</option>
            <option value="carpool">Shared Carpool</option>
            <option value="motorcycle">Two-Wheeler / Scooter</option>
            <option value="auto_cng">CNG Auto-Rickshaw</option>
            <option value="bus">City Bus</option>
            <option value="metro">Metro Rail</option>
            <option value="bicycle">Bicycle</option>
            <option value="walking">Walking</option>
            <option value="remote">Work / Study from Home</option>
          </select>
        </label>

        <label className="text-ink-body block text-xs font-semibold">
          One-way commute distance (km)
          <input
            type="number"
            min={0}
            max={150}
            value={draft.commuteDistanceKmOneWay}
            onChange={(e) =>
              onChange({
                ...draft,
                commuteDistanceKmOneWay: Math.max(0, Number(e.target.value) || 0),
              })
            }
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <HouseholdScheduleSelects draft={draft} onChange={onChange} />

      <label className="border-border-warm bg-surface flex items-center gap-2 rounded-xl border p-3 text-sm font-medium">
        <input
          type="checkbox"
          checked={draft.hasSchoolGoingChildren}
          onChange={(e) => onChange({ ...draft, hasSchoolGoingChildren: e.target.checked })}
          className="accent-brand h-4 w-4"
        />
        Include school commute & afternoon play planning
      </label>

      <fieldset className="border-border-warm bg-surface rounded-xl border p-3">
        <legend className="text-ink-body px-1 text-xs font-bold">
          Optional priority protection preferences (kept local, excluded from AI logs)
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {PROTECTION_OPTIONS.map((opt) => (
            <label key={opt.id} className="text-ink flex items-center gap-2 text-xs font-medium">
              <input
                type="checkbox"
                checked={draft.protectionFlags.includes(opt.id)}
                onChange={() => toggleFlag(opt.id)}
                className="accent-brand h-4 w-4"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
