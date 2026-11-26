import { Check, Copy, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { CommunityRoleSchema } from '../../domain/community/types.ts';
import { parseEnumValue } from '../../domain/select-guards.ts';
import { useAppStore } from '../../store/useAppStore.ts';
import { Card } from '../ui/Primitives.tsx';
import { AddCommunityActionForm } from './AddCommunityActionForm.tsx';
import { CommunityActionCard } from './CommunityActionCard.tsx';

export function CommunityScreen() {
  const { communityPlan, updateCommunityPlan, updateCommunityActionStatus, addCommunityAction } =
    useAppStore(
      useShallow((s) => ({
        communityPlan: s.communityPlan,
        updateCommunityPlan: s.updateCommunityPlan,
        updateCommunityActionStatus: s.updateCommunityActionStatus,
        addCommunityAction: s.addCommunityAction,
      })),
    );

  const [editingName, setEditingName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nameDraft = editingName ?? communityPlan.communityName;

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleCommunityNameChange = (value: string) => {
    setEditingName(value);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void updateCommunityPlan({ ...useAppStore.getState().communityPlan, communityName: value });
      setEditingName(null);
    }, 300);
  };

  const flushCommunityName = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (editingName !== null && editingName !== communityPlan.communityName) {
      void updateCommunityPlan({ ...communityPlan, communityName: editingName });
    }
    setEditingName(null);
  };

  const handleCopySummary = async () => {
    const lines = [
      `Clean-Air Community Action Plan: ${nameDraft} (${communityPlan.city})`,
      'Note: Local organizer plan — no private household data included.',
      '',
      ...communityPlan.actions.map(
        (a, i) =>
          `${i + 1}. [${a.status.toUpperCase()}] ${a.title} — Lead: ${a.responsibleRole} (Target: ${a.suggestedDeadline})`,
      ),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(lines);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      void err;
      setCopied(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="text-brand h-5 w-5" aria-hidden="true" />
              <h1 className="text-ink text-2xl font-extrabold">Community Organizer Workspace</h1>
            </div>
            <p className="text-ink-muted mt-1 text-sm">
              Local planning workspace for housing societies (RWAs), schools, and volunteers. Saved
              locally in your browser—no fake social feed and no private household data shared.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={() => void handleCopySummary()}
              className="border-border-strong bg-canvas text-ink hover:bg-hover-warm inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold"
            >
              {copied ? (
                <>
                  <Check className="text-brand h-4 w-4" aria-hidden="true" /> Summary Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" /> Copy Shareable Checklist
                </>
              )}
            </button>
            <output aria-live="polite" className="sr-only">
              {copied ? 'Community checklist summary copied to clipboard.' : ''}
            </output>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-ink-body block text-xs font-semibold">
            Community / School / Society name
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => handleCommunityNameChange(e.target.value)}
              onBlur={flushCommunityName}
              className="border-border-strong bg-canvas mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-ink-body block text-xs font-semibold">
            Organizer role
            <select
              value={communityPlan.organizerRole}
              onChange={(e) =>
                void updateCommunityPlan({
                  ...communityPlan,
                  organizerRole: parseEnumValue(
                    CommunityRoleSchema,
                    e.target.value,
                    communityPlan.organizerRole,
                  ),
                })
              }
              className="border-border-strong bg-canvas mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            >
              <option value="rwa_coordinator">RWA / Housing Society Coordinator</option>
              <option value="school_coordinator">School Coordinator</option>
              <option value="resident_volunteer">Resident Volunteer</option>
              <option value="society_committee">Society Committee Member</option>
            </select>
          </label>
        </div>
      </Card>

      <AddCommunityActionForm onAddAction={addCommunityAction} />

      <div className="space-y-3">
        {communityPlan.actions.map((action) => (
          <CommunityActionCard
            key={action.id}
            action={action}
            onStatusChange={(id, status) => void updateCommunityActionStatus(id, status)}
          />
        ))}
      </div>
    </div>
  );
}
