import { useState } from 'react';
import type {
  BudgetLevel,
  HouseholdProfile,
  TransportMode,
  VulnerabilityFlag,
} from '../../domain/household/types.ts';
import { AccessibleModal, PrimaryButton, SecondaryButton } from '../ui/Primitives.tsx';

const PROTECTION_OPTIONS: readonly { id: VulnerabilityFlag; label: string }[] = [
  { id: 'children', label: 'Young or school-going children' },
  { id: 'older_adults', label: 'Older adults (60+)' },
  { id: 'pregnant', label: 'Pregnant household member' },
  { id: 'respiratory_or_heart', label: 'Sensitive breathing or heart comfort needs' },
];

export function HouseholdModal({
  open,
  onOpenChange,
  profile,
  onSave,
  onResetAll,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: HouseholdProfile;
  onSave: (next: HouseholdProfile) => void;
  onResetAll: () => void;
}) {
  const [draft, setDraft] = useState<HouseholdProfile>(profile);

  const toggleFlag = (flag: VulnerabilityFlag) => {
    const exists = draft.protectionFlags.includes(flag);
    setDraft({
      ...draft,
      protectionFlags: exists
        ? draft.protectionFlags.filter((f) => f !== flag)
        : [...draft.protectionFlags, flag],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...draft, isDemo: false });
    onOpenChange(false);
  };

  return (
    <AccessibleModal
      open={open}
      onOpenChange={(isOpen) => {
        if (isOpen) setDraft(profile);
        onOpenChange(isOpen);
      }}
      title="Household & Routine Context"
      description="Voluntary preferences stored only in your browser. We never ask for medical records or diagnoses."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#44403C]">
            Household label
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
              maxLength={60}
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold text-[#44403C]">
            Household size
            <input
              type="number"
              min={1}
              max={20}
              value={draft.memberCount}
              onChange={(e) =>
                setDraft({ ...draft, memberCount: Math.max(1, Number(e.target.value) || 1) })
              }
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#44403C]">
            Main commute mode
            <select
              value={draft.primaryCommuteMode}
              onChange={(e) =>
                setDraft({ ...draft, primaryCommuteMode: e.target.value as TransportMode })
              }
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-white px-3 py-2 text-sm"
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

          <label className="block text-xs font-semibold text-[#44403C]">
            One-way commute distance (km)
            <input
              type="number"
              min={0}
              max={150}
              value={draft.commuteDistanceKmOneWay}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  commuteDistanceKmOneWay: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-semibold text-[#44403C]">
            Work schedule
            <select
              value={draft.workPattern}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  workPattern: e.target.value as HouseholdProfile['workPattern'],
                })
              }
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-white px-3 py-2 text-sm"
            >
              <option value="office">Regular Office / Site</option>
              <option value="hybrid">Hybrid / Flexible</option>
              <option value="remote">Remote</option>
              <option value="outdoor_work">Outdoor Work</option>
              <option value="shift">Shift Schedule</option>
            </select>
          </label>

          <label className="block text-xs font-semibold text-[#44403C]">
            Outdoor exercise habit
            <select
              value={draft.outdoorExerciseHabit}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  outdoorExerciseHabit: e.target.value as HouseholdProfile['outdoorExerciseHabit'],
                })
              }
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-white px-3 py-2 text-sm"
            >
              <option value="morning_walk_run">Morning walk / run</option>
              <option value="evening_walk_run">Evening walk / run</option>
              <option value="flexible">Flexible timing</option>
              <option value="none">Mostly indoor / none</option>
            </select>
          </label>

          <label className="block text-xs font-semibold text-[#44403C]">
            Budget for improvements
            <select
              value={draft.budget}
              onChange={(e) => setDraft({ ...draft, budget: e.target.value as BudgetLevel })}
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-white px-3 py-2 text-sm"
            >
              <option value="zero_cost">Zero cost only</option>
              <option value="low">Low cost</option>
              <option value="moderate">Moderate</option>
              <option value="flexible">Flexible</option>
            </select>
          </label>
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-[#E4DCCD] bg-white p-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={draft.hasSchoolGoingChildren}
            onChange={(e) => setDraft({ ...draft, hasSchoolGoingChildren: e.target.checked })}
            className="h-4 w-4 accent-[#0F6E56]"
          />
          Include school commute & afternoon play planning
        </label>

        <fieldset className="rounded-xl border border-[#E4DCCD] bg-white p-3">
          <legend className="px-1 text-xs font-bold text-[#44403C]">
            Optional priority protection preferences (kept local, excluded from AI logs)
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {PROTECTION_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 text-xs font-medium text-[#1C1917]"
              >
                <input
                  type="checkbox"
                  checked={draft.protectionFlags.includes(opt.id)}
                  onChange={() => toggleFlag(opt.id)}
                  className="h-4 w-4 accent-[#0F6E56]"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onResetAll();
              onOpenChange(false);
            }}
            className="text-xs font-semibold text-[#B91C1C] underline hover:text-red-900"
          >
            Delete & Reset Local Data
          </button>
          <div className="flex gap-2">
            <SecondaryButton type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">Save Household Context</PrimaryButton>
          </div>
        </div>
      </form>
    </AccessibleModal>
  );
}
