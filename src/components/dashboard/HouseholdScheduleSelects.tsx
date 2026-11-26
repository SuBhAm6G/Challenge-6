import {
  BudgetLevelSchema,
  ExerciseHabitSchema,
  type HouseholdProfile,
  WorkPatternSchema,
} from '../../domain/household/types.ts';
import { parseEnumValue } from '../../domain/select-guards.ts';

const SELECT_CLASS =
  'mt-1 w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm';

export function HouseholdScheduleSelects({
  draft,
  onChange,
}: {
  draft: HouseholdProfile;
  onChange: (next: HouseholdProfile) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-ink-body block text-xs font-semibold">
        Work schedule
        <select
          value={draft.workPattern}
          onChange={(e) =>
            onChange({
              ...draft,
              workPattern: parseEnumValue(WorkPatternSchema, e.target.value, draft.workPattern),
            })
          }
          className={SELECT_CLASS}
        >
          <option value="office">Regular Office / Site</option>
          <option value="hybrid">Hybrid / Flexible</option>
          <option value="remote">Remote</option>
          <option value="outdoor_work">Outdoor Work</option>
          <option value="shift">Shift Schedule</option>
        </select>
      </label>

      <label className="text-ink-body block text-xs font-semibold">
        Outdoor exercise habit
        <select
          value={draft.outdoorExerciseHabit}
          onChange={(e) =>
            onChange({
              ...draft,
              outdoorExerciseHabit: parseEnumValue(
                ExerciseHabitSchema,
                e.target.value,
                draft.outdoorExerciseHabit,
              ),
            })
          }
          className={SELECT_CLASS}
        >
          <option value="morning_walk_run">Morning walk / run</option>
          <option value="evening_walk_run">Evening walk / run</option>
          <option value="flexible">Flexible timing</option>
          <option value="none">Mostly indoor / none</option>
        </select>
      </label>

      <label className="text-ink-body block text-xs font-semibold">
        Budget for improvements
        <select
          value={draft.budget}
          onChange={(e) =>
            onChange({
              ...draft,
              budget: parseEnumValue(BudgetLevelSchema, e.target.value, draft.budget),
            })
          }
          className={SELECT_CLASS}
        >
          <option value="zero_cost">Zero cost only</option>
          <option value="low">Low cost</option>
          <option value="moderate">Moderate</option>
          <option value="flexible">Flexible</option>
        </select>
      </label>
    </div>
  );
}
