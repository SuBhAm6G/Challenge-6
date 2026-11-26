import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SOURCE_BY_ID } from '../../data/sources.ts';
import type { IndoorAction } from '../../domain/indoor/types.ts';
import { Badge, Card } from '../ui/Primitives.tsx';

export function IndoorActionCard({
  action,
  isDone,
  onToggle,
}: {
  action: IndoorAction;
  isDone: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <Card className={isDone ? 'border-brand bg-emerald-50/35' : ''}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1.5">
            <Badge
              className={
                action.priority === 'high'
                  ? 'border-orange-300 bg-orange-100 text-orange-950'
                  : 'border-border-warm bg-canvas text-ink-body'
              }
            >
              {action.priority.toUpperCase()} PRIORITY
            </Badge>
            <Badge>{action.costEffort}</Badge>
          </div>
          <h3 className="text-ink text-base font-bold">{action.title}</h3>
        </div>
        <button
          type="button"
          onClick={() => onToggle(action.id)}
          aria-pressed={isDone}
          aria-label={`${isDone ? 'Checked' : 'Check off'}: ${action.title}`}
          className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
            isDone
              ? 'border-brand bg-brand text-white'
              : 'border-border-strong bg-surface text-ink hover:bg-hover-warm'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {isDone ? 'Checked' : 'Check off'}
        </button>
      </div>

      <p className="text-ink-body mt-2 text-sm">{action.whatToDo}</p>
      <div className="bg-canvas text-ink-body mt-3 space-y-1.5 rounded-xl p-3 text-xs">
        <p>
          <strong>Why it helps:</strong> {action.whyItHelps}
        </p>
        <p>
          <strong>Limitations:</strong> {action.limitations}
        </p>
        <p className="text-amber-ink flex items-start gap-1.5 font-medium">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{action.safetyNote}</span>
        </p>
        <p className="text-ink-muted text-[11px]">
          Evidence: {action.evidenceIds.map((id) => SOURCE_BY_ID.get(id)?.name ?? id).join(' • ')}
        </p>
      </div>
    </Card>
  );
}
