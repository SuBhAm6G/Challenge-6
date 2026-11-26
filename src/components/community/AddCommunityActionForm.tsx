import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { CommunityAction } from '../../domain/community/types.ts';
import { Card, PrimaryButton } from '../ui/Primitives.tsx';

export function AddCommunityActionForm({
  onAddAction,
}: {
  onAddAction: (action: CommunityAction) => Promise<void>;
}) {
  const [newTitle, setNewTitle] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDeadline, setNewDeadline] = useState('This week');
  const [newExplanation, setNewExplanation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newRole.trim()) return;
    await onAddAction({
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

  return (
    <Card>
      <h2 className="text-ink text-base font-bold">Add Community Action Item</h2>
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-ink-body block text-xs font-semibold sm:col-span-2">
          Action title
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Install electric heater for night security cabin"
            required
            maxLength={120}
            className="border-border-strong bg-canvas mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-ink-body block text-xs font-semibold">
          Responsible role
          <input
            type="text"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="e.g. RWA Estate Manager"
            required
            maxLength={80}
            className="border-border-strong bg-canvas mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-ink-body block text-xs font-semibold">
          Suggested deadline
          <input
            type="text"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            maxLength={60}
            className="border-border-strong bg-canvas mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-ink-body block text-xs font-semibold sm:col-span-2">
          Why this helps
          <input
            type="text"
            value={newExplanation}
            onChange={(e) => setNewExplanation(e.target.value)}
            placeholder="Optional note explaining local source-control or coordination benefit"
            maxLength={240}
            className="border-border-strong bg-canvas mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </label>
        <div className="sm:col-span-3">
          <PrimaryButton type="submit">
            <Plus className="h-4 w-4" aria-hidden="true" /> Add to Community Checklist
          </PrimaryButton>
        </div>
      </form>
    </Card>
  );
}
