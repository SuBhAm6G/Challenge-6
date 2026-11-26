import { useState } from 'react';
import type { HouseholdProfile } from '../../domain/household/types.ts';
import { AccessibleModal, PrimaryButton, SecondaryButton } from '../ui/Primitives.tsx';
import { HouseholdFormFields } from './HouseholdFormFields.tsx';

function HouseholdModalForm({
  profile,
  onSave,
  onResetAll,
  onClose,
}: {
  profile: HouseholdProfile;
  onSave: (next: HouseholdProfile) => void;
  onResetAll: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<HouseholdProfile>(profile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...draft, isDemo: false });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <HouseholdFormFields draft={draft} onChange={setDraft} />

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            onResetAll();
            onClose();
          }}
          className="text-danger-ink min-h-[44px] text-xs font-semibold underline hover:text-red-900"
        >
          Delete & Reset Local Data
        </button>
        <div className="flex gap-2">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit">Save Household Context</PrimaryButton>
        </div>
      </div>
    </form>
  );
}

/**
 * Dialog for editing local-only household commute, exercise, budget, and protection context.
 * Remounts its draft form whenever reopened or hydrated so saved state is never stale.
 */
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
  return (
    <AccessibleModal
      open={open}
      onOpenChange={onOpenChange}
      title="Household & Routine Context"
      description="Voluntary preferences stored only in your browser. We never ask for medical records or diagnoses."
    >
      <HouseholdModalForm
        key={open ? `${profile.id}-${profile.updatedAt}` : 'closed'}
        profile={profile}
        onSave={onSave}
        onResetAll={onResetAll}
        onClose={() => onOpenChange(false)}
      />
    </AccessibleModal>
  );
}
