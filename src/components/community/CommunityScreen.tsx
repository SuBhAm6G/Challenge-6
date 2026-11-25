import { Check, Copy, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { SOURCE_BY_ID } from '../../data/sources.ts';
import type { CommunityActionStatus, CommunityRole } from '../../domain/community/types.ts';
import { useAppStore } from '../../store/useAppStore.ts';
import { Badge, Card, PrimaryButton } from '../ui/Primitives.tsx';

export function CommunityScreen() {
  const { communityPlan, updateCommunityPlan, updateCommunityActionStatus, addCommunityAction } =
    useAppStore();
  const [newTitle, setNewTitle] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDeadline, setNewDeadline] = useState('This week');
  const [newExplanation, setNewExplanation] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newRole.trim()) return;
    await addCommunityAction({
      id: `comm-${Date.now()}`,
      title: newTitle.trim(),
      responsibleRole: newRole.trim(),
      suggestedDeadline: newDeadline.trim() || 'Ongoing',
      status: 'planned',
      effort: 'moderate',
      explanation:
        newExplanation.trim() ||
        'Coordinated local clean-air measure planned in the community organizer workspace.',
    });
    setNewTitle('');
    setNewRole('');
    setNewExplanation('');
  };

  const handleCopySummary = async () => {
    const lines = [
      `Clean-Air Community Action Plan: ${communityPlan.communityName} (${communityPlan.city})`,
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
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#0F6E56]" aria-hidden="true" />
              <h1 className="text-2xl font-extrabold text-[#1C1917]">
                Community Organizer Workspace
              </h1>
            </div>
            <p className="mt-1 text-sm text-[#57534E]">
              Local planning workspace for housing societies (RWAs), schools, and volunteers. Saved
              locally in your browser—no fake social feed and no private household data shared.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#D6CCBA] bg-[#FAF7F2] px-3.5 py-2 text-xs font-semibold text-[#1C1917] hover:bg-[#EFE8DA]"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-[#0F6E56]" aria-hidden="true" /> Summary Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" /> Copy Shareable Checklist
              </>
            )}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#44403C]">
            Community / School / Society name
            <input
              type="text"
              value={communityPlan.communityName}
              onChange={(e) =>
                updateCommunityPlan({ ...communityPlan, communityName: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-[#FAF7F2] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold text-[#44403C]">
            Organizer role
            <select
              value={communityPlan.organizerRole}
              onChange={(e) =>
                updateCommunityPlan({
                  ...communityPlan,
                  organizerRole: e.target.value as CommunityRole,
                })
              }
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-[#FAF7F2] px-3 py-2 text-sm"
            >
              <option value="rwa_coordinator">RWA / Housing Society Coordinator</option>
              <option value="school_coordinator">School Coordinator</option>
              <option value="resident_volunteer">Resident Volunteer</option>
              <option value="society_committee">Society Committee Member</option>
            </select>
          </label>
        </div>
      </Card>

      {/* Add new community action */}
      <Card>
        <h2 className="text-base font-bold text-[#1C1917]">Add Community Action Item</h2>
        <form onSubmit={handleAddAction} className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-semibold text-[#44403C] sm:col-span-2">
            Action title
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Install electric heater for night security cabin"
              required
              maxLength={120}
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-[#FAF7F2] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold text-[#44403C]">
            Responsible role
            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="e.g. RWA Estate Manager"
              required
              maxLength={80}
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-[#FAF7F2] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold text-[#44403C]">
            Suggested deadline
            <input
              type="text"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              maxLength={60}
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-[#FAF7F2] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold text-[#44403C] sm:col-span-2">
            Why this helps
            <input
              type="text"
              value={newExplanation}
              onChange={(e) => setNewExplanation(e.target.value)}
              placeholder="Optional note explaining local source-control or coordination benefit"
              maxLength={240}
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-[#FAF7F2] px-3 py-2 text-sm"
            />
          </label>
          <div className="sm:col-span-3">
            <PrimaryButton type="submit">
              <Plus className="h-4 w-4" aria-hidden="true" /> Add to Community Checklist
            </PrimaryButton>
          </div>
        </form>
      </Card>

      {/* Action Checklist */}
      <div className="space-y-3">
        {communityPlan.actions.map((action) => (
          <Card key={action.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap gap-2">
                  <Badge>Lead: {action.responsibleRole}</Badge>
                  <Badge>Target: {action.suggestedDeadline}</Badge>
                  <Badge>Effort: {action.effort}</Badge>
                </div>
                <h3 className="text-base font-bold text-[#1C1917]">{action.title}</h3>
                <p className="text-sm text-[#44403C]">{action.explanation}</p>
                {action.evidenceId && (
                  <p className="text-xs text-[#57534E]">
                    Reference: {SOURCE_BY_ID.get(action.evidenceId)?.name ?? action.evidenceId}
                  </p>
                )}
              </div>

              <label className="shrink-0 text-xs font-semibold text-[#44403C]">
                Status
                <select
                  value={action.status}
                  onChange={(e) =>
                    updateCommunityActionStatus(action.id, e.target.value as CommunityActionStatus)
                  }
                  aria-label={`Status for ${action.title}`}
                  className="mt-1 block rounded-xl border border-[#D6CCBA] bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#1C1917]"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
