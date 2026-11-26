import { AlertTriangle, ExternalLink, Sparkles } from 'lucide-react';
import type { AssistantTurnResult } from '../../ai/client.ts';
import { SOURCE_BY_ID } from '../../data/sources.ts';
import { Badge } from '../ui/Primitives.tsx';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  turn?: AssistantTurnResult;
}

export function AssistantMessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="bg-brand ml-auto max-w-2xl rounded-2xl p-3.5 text-sm text-white">
        <p>{message.text}</p>
      </div>
    );
  }

  const turn = message.turn;
  return (
    <div className="border-border-warm bg-canvas text-ink rounded-2xl border p-4 text-sm">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={
              turn?.origin === 'groq_ai'
                ? 'border-emerald-300 bg-emerald-100 text-emerald-950'
                : turn?.origin === 'urgent_medical_redirect'
                  ? 'border-red-300 bg-red-100 text-red-950'
                  : 'border-amber-300 bg-amber-100 text-amber-950'
            }
          >
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {turn?.origin === 'groq_ai'
              ? 'AI-Assisted Explanation (Validated)'
              : turn?.origin === 'urgent_medical_redirect'
                ? 'Medical Safety Redirect'
                : 'Deterministic Offline Fallback'}
          </Badge>
        </div>

        <p className="leading-relaxed">{turn?.response.summary}</p>

        {turn?.safetyWarnings && turn.safetyWarnings.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{turn.safetyWarnings.join(' ')}</span>
          </div>
        )}

        {turn && turn.response.recommendations.length > 0 && (
          <div className="space-y-2">
            {turn.response.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="border-border-warm bg-surface rounded-xl border p-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-ink text-sm">{rec.action}</strong>
                  <Badge>{rec.timing}</Badge>
                </div>
                <p className="text-ink-body mt-1">{rec.reason}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <p className="bg-canvas rounded-lg p-2">
                    <strong className="text-brand">Exposure:</strong> {rec.exposureConsideration}
                  </p>
                  <p className="bg-canvas rounded-lg p-2">
                    <strong className="text-amber-ink">Environment:</strong>{' '}
                    {rec.environmentalConsideration}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {turn && (
          <div className="border-border-warm text-ink-muted space-y-1 border-t pt-2 text-[11px]">
            <p>{turn.response.disclaimer}</p>
            <div className="flex flex-wrap gap-2">
              {turn.response.sourceIdsUsed.map((id) => {
                const src = SOURCE_BY_ID.get(id);
                if (!src) return null;
                return (
                  <a
                    key={id}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand inline-flex items-center gap-1 underline"
                  >
                    {src.name}
                    <span className="sr-only"> (opens in new tab)</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
