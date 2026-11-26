import { SOURCE_BY_ID } from '../../data/sources.ts';
import {
  type CommunityAction,
  type CommunityActionStatus,
  CommunityActionStatusSchema,
} from '../../domain/community/types.ts';
import { parseEnumValue } from '../../domain/select-guards.ts';
import { Badge, Card } from '../ui/Primitives.tsx';

export function CommunityActionCard({
  action,
  onStatusChange,
}: {
  action: CommunityAction;
  onStatusChange: (actionId: string, status: CommunityActionStatus) => void;
}) {
  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap gap-2">
            <Badge>Lead: {action.responsibleRole}</Badge>
            <Badge>Target: {action.suggestedDeadline}</Badge>
            <Badge>Effort: {action.effort}</Badge>
          </div>
          <h3 className="text-ink text-base font-bold">{action.title}</h3>
          <p className="text-ink-body text-sm">{action.explanation}</p>
          {action.evidenceId && (
            <p className="text-ink-muted text-xs">
              Reference: {SOURCE_BY_ID.get(action.evidenceId)?.name ?? action.evidenceId}
            </p>
          )}
        </div>

        <label className="text-ink-body shrink-0 text-xs font-semibold">
          Status
          <select
            value={action.status}
            onChange={(e) =>
              onStatusChange(
                action.id,
                parseEnumValue(CommunityActionStatusSchema, e.target.value, action.status),
              )
            }
            aria-label={`Status for ${action.title}`}
            className="border-border-strong bg-canvas text-ink mt-1 block min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold"
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </div>
    </Card>
  );
}
