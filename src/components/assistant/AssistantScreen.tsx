import { Bot, Lock, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { askSaansathiAssistant } from '../../ai/client.ts';
import { buildAiContextPackage } from '../../ai/context-builder.ts';
import { generateDailyRoutine } from '../../engines/routine-engine.ts';
import { DEFAULT_DEMO_LOCATION } from '../../store/defaults.ts';
import { useAppStore } from '../../store/useAppStore.ts';
import { Badge, Card, PrimaryButton } from '../ui/Primitives.tsx';
import { AssistantMessageBubble, type ChatMessage } from './AssistantMessageBubble.tsx';

const QUICK_PROMPTS = [
  'What should my family prioritize today?',
  'When could I go for a walk based on the forecast?',
  'How should I adjust my children’s outdoor activities?',
  'Which indoor changes work without buying an air purifier?',
  'Compare my commute options for exposure vs emissions.',
  'Why is PM2.5 highlighted in today’s air quality?',
  'What can our housing society do together this week?',
  'What should I do if live air-quality data is unavailable?',
] as const;

export function AssistantScreen() {
  const {
    locationPresets,
    selectedLocationId,
    currentReading,
    aqiResult,
    forecast,
    householdProfile,
    indoorProfile,
    setAiStatus,
  } = useAppStore(
    useShallow((s) => ({
      locationPresets: s.locationPresets,
      selectedLocationId: s.selectedLocationId,
      currentReading: s.currentReading,
      aqiResult: s.aqiResult,
      forecast: s.forecast,
      householdProfile: s.householdProfile,
      indoorProfile: s.indoorProfile,
      setAiStatus: s.setAiStatus,
    })),
  );

  const activeLoc =
    locationPresets.find((l) => l.id === selectedLocationId) ??
    locationPresets[0] ??
    DEFAULT_DEMO_LOCATION;
  const deterministicRoutine = generateDailyRoutine(householdProfile, aqiResult, forecast);
  const contextPkg = buildAiContextPackage({
    location: activeLoc,
    reading: currentReading,
    aqiResult,
    forecast,
    household: householdProfile,
    indoor: indoorProfile,
    deterministicRoutine,
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const seqRef = useRef(0);

  const submitQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { id: `u-${++seqRef.current}`, role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setAiStatus('loading');

    const turn = await askSaansathiAssistant({
      question: trimmed,
      context: contextPkg,
      deterministicRoutine,
    });

    setLoading(false);
    setAiStatus(turn.origin === 'groq_ai' ? 'ready' : 'unavailable', turn.errorDetail ?? null);

    setMessages((prev) => [
      ...prev,
      { id: `a-${++seqRef.current}`, role: 'assistant', text: turn.response.summary, turn },
    ]);
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="text-brand h-5 w-5" aria-hidden="true" />
              <h1 className="text-ink text-2xl font-extrabold">
                Ask Saansathi (Contextual Assistant)
              </h1>
            </div>
            <p className="text-ink-muted mt-1 text-sm">
              Powered by Groq AI on the server, strictly grounded in your city’s validated
              air-quality data and deterministic rules. Falls back offline automatically.
            </p>
          </div>
          <Badge className="border-emerald-300 bg-emerald-50 text-emerald-950">
            <Lock className="h-3 w-3" aria-hidden="true" /> City-level context only • No health
            records sent
          </Badge>
        </div>
      </Card>

      <Card>
        <div className="space-y-4" aria-live="polite" aria-relevant="additions" aria-busy={loading}>
          {messages.length === 0 ? (
            <div className="border-border-strong bg-canvas text-ink-muted rounded-xl border border-dashed p-5 text-center text-sm">
              Ask a question below or tap any quick prompt below. Saansathi will tailor explanations
              for <strong>{contextPkg.city}</strong> and your household profile while keeping
              exposure and emissions distinct.
            </div>
          ) : (
            messages.map((msg) => <AssistantMessageBubble key={msg.id} message={msg} />)
          )}
        </div>
        <output aria-live="polite" className="sr-only">
          {loading ? 'Generating contextual air-quality guidance…' : ''}
        </output>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitQuestion(input);
          }}
          className="mt-4 flex gap-2"
        >
          <label htmlFor="saansathi-question" className="sr-only">
            Ask Saansathi a question
          </label>
          <input
            id="saansathi-question"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about timing walks, school commutes, indoor tips, or trade-offs…"
            maxLength={800}
            className="border-border-strong bg-canvas text-ink flex-1 rounded-xl border px-3.5 py-2.5 text-sm"
          />
          <PrimaryButton type="submit" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>{loading ? 'Thinking…' : 'Ask'}</span>
          </PrimaryButton>
        </form>
      </Card>

      <Card>
        <h2 className="text-ink text-sm font-bold">Contextual Quick Prompts</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => submitQuestion(q)}
              className="border-border-strong bg-canvas text-ink hover:bg-hover-warm min-h-[44px] rounded-xl border px-3 py-2 text-left text-xs font-medium disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
