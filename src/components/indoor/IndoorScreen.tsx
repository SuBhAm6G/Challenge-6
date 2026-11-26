import { ShieldAlert, Wind } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { evaluateVentilationGuidance, generateIndoorActions } from '../../engines/indoor-engine.ts';
import { useAppStore } from '../../store/useAppStore.ts';
import { Badge, Card } from '../ui/Primitives.tsx';
import { IndoorActionCard } from './IndoorActionCard.tsx';
import { IndoorSetupCard } from './IndoorSetupCard.tsx';

export function IndoorScreen() {
  const {
    indoorProfile,
    aqiResult,
    forecast,
    completedIndoorActionIds,
    updateIndoorProfile,
    toggleIndoorAction,
  } = useAppStore(
    useShallow((s) => ({
      indoorProfile: s.indoorProfile,
      aqiResult: s.aqiResult,
      forecast: s.forecast,
      completedIndoorActionIds: s.completedIndoorActionIds,
      updateIndoorProfile: s.updateIndoorProfile,
      toggleIndoorAction: s.toggleIndoorAction,
    })),
  );

  const ventilation = evaluateVentilationGuidance(indoorProfile, aqiResult, forecast);
  const actions = generateIndoorActions(indoorProfile, aqiResult);

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-ink text-2xl font-extrabold">Indoor Air-Quality Toolkit</h1>
            <p className="text-ink-muted text-sm">
              Practical, budget-sensitive source control, safe ventilation timing, and evidence-only
              filtration guidance.
            </p>
          </div>
          <Badge className="border-emerald-300 bg-emerald-50 text-emerald-950">
            Zero Ozone Generators • Zero Unproven Myths
          </Badge>
        </div>

        <div className="border-border-strong bg-canvas mt-4 rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <Wind className="text-brand h-5 w-5" aria-hidden="true" />
            <h2 className="text-ink text-base font-bold">
              Ventilation Intelligence: {ventilation.headline}
            </h2>
          </div>
          <p className="text-ink-body mt-1.5 text-sm">{ventilation.explanation}</p>
          {ventilation.recommendedWindowText && (
            <p className="text-brand mt-1.5 text-sm font-semibold">
              {ventilation.recommendedWindowText}
            </p>
          )}
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{ventilation.combustionSafetyWarning}</span>
          </div>
        </div>
      </Card>

      <IndoorSetupCard
        indoorProfile={indoorProfile}
        onUpdate={(next) => void updateIndoorProfile(next)}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((action) => (
          <IndoorActionCard
            key={action.id}
            action={action}
            isDone={completedIndoorActionIds.includes(action.id)}
            onToggle={(id) => void toggleIndoorAction(id)}
          />
        ))}
      </div>
    </div>
  );
}
