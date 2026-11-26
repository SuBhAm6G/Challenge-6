import { AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { evaluateCleanAirAlerts } from '../../engines/alert-engine.ts';
import { evaluateReadingFreshness } from '../../engines/freshness.ts';
import { evaluateVentilationGuidance } from '../../engines/indoor-engine.ts';
import { generateDailyRoutine } from '../../engines/routine-engine.ts';
import { useAppStore } from '../../store/useAppStore.ts';
import { Card, PrimaryButton, SecondaryButton } from '../ui/Primitives.tsx';
import { AlertsCard } from './AlertsCard.tsx';
import { AqiHeroCard } from './AqiHeroCard.tsx';
import { HomeRoutinePreviewCard } from './HomeRoutinePreviewCard.tsx';
import { HourlyForecastChart } from './HourlyForecastChart.tsx';
import { PollutantBreakdownCard } from './PollutantBreakdownCard.tsx';

export function HomeScreen() {
  const {
    locationPresets,
    selectedLocationId,
    currentReading,
    forecast,
    aqiResult,
    previousCategory,
    householdProfile,
    indoorProfile,
    alertPreferences,
    routineStatuses,
    completedIndoorActionIds,
    impactHistory,
    setRoute,
    setRoutineStatus,
    updateAlertPreferences,
  } = useAppStore(
    useShallow((s) => ({
      locationPresets: s.locationPresets,
      selectedLocationId: s.selectedLocationId,
      currentReading: s.currentReading,
      forecast: s.forecast,
      aqiResult: s.aqiResult,
      previousCategory: s.previousCategory,
      householdProfile: s.householdProfile,
      indoorProfile: s.indoorProfile,
      alertPreferences: s.alertPreferences,
      routineStatuses: s.routineStatuses,
      completedIndoorActionIds: s.completedIndoorActionIds,
      impactHistory: s.impactHistory,
      setRoute: s.setRoute,
      setRoutineStatus: s.setRoutineStatus,
      updateAlertPreferences: s.updateAlertPreferences,
    })),
  );

  const activeLoc = locationPresets.find((l) => l.id === selectedLocationId) ?? locationPresets[0];
  const freshness = evaluateReadingFreshness(currentReading);
  const routine = generateDailyRoutine(householdProfile, aqiResult, forecast);
  const ventilation = evaluateVentilationGuidance(indoorProfile, aqiResult, forecast);
  const alerts = evaluateCleanAirAlerts({
    reading: currentReading,
    aqiResult,
    previousCategory,
    forecast,
    preferences: alertPreferences,
    hasAirPurifier: indoorProfile.hasAirPurifier,
  });

  const totalCo2AvoidedKg = impactHistory.reduce((sum, item) => sum + (item.co2eAvoidedKg ?? 0), 0);
  const completedRoutineCount = routine.filter(
    (r) => routineStatuses[r.id] === 'completed' || routineStatuses[r.id] === 'accepted',
  ).length;

  return (
    <div className="space-y-5">
      <AqiHeroCard
        activeLocation={activeLoc}
        currentReading={currentReading}
        aqiResult={aqiResult}
        freshness={freshness}
      />

      <AlertsCard
        alerts={alerts}
        alertPreferences={alertPreferences}
        onUpdatePreferences={updateAlertPreferences}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <HomeRoutinePreviewCard
          householdName={householdProfile.name}
          routine={routine}
          routineStatuses={routineStatuses}
          onOpenTimeline={() => setRoute('routine')}
          onToggleStatus={(id, next) => void setRoutineStatus(id, next)}
        />

        <div className="space-y-5">
          <Card>
            <h2 className="text-ink text-base font-bold">Indoor Air & Ventilation</h2>
            <p className="text-brand mt-1 text-sm font-semibold">{ventilation.headline}</p>
            <p className="text-ink-body mt-1 text-xs">{ventilation.explanation}</p>
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{ventilation.combustionSafetyWarning}</span>
            </div>
            <div className="mt-3">
              <PrimaryButton type="button" onClick={() => setRoute('indoor')} className="w-full">
                Open Indoor Air Toolkit ({completedIndoorActionIds.length} done)
              </PrimaryButton>
            </div>
          </Card>

          <Card>
            <h2 className="text-ink text-base font-bold">Impact Overview (Separate)</h2>
            <p className="text-ink-muted mt-0.5 text-xs">
              Exposure protection and emission reductions are never combined into one arbitrary
              score.
            </p>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="border-border-warm bg-canvas rounded-xl border p-3">
                <p className="text-brand font-bold">1. Personal Exposure Management</p>
                <p className="text-ink mt-0.5">
                  {completedRoutineCount} of {routine.length} routine adjustments active •{' '}
                  {completedIndoorActionIds.length} indoor habits checked
                </p>
              </div>
              <div className="border-border-warm bg-canvas rounded-xl border p-3">
                <p className="text-amber-ink font-bold">2. Estimated Avoided Emissions</p>
                <p className="text-ink mt-0.5">
                  {totalCo2AvoidedKg > 0
                    ? `~${totalCo2AvoidedKg.toFixed(1)} kg CO2e logged (illustrative)`
                    : 'No commute shifts logged yet—explore Better Choices'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <SecondaryButton type="button" onClick={() => setRoute('impact')} className="flex-1">
                View Impact
              </SecondaryButton>
              <SecondaryButton
                type="button"
                onClick={() => setRoute('assistant')}
                className="flex-1"
              >
                Ask AI
              </SecondaryButton>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-ink text-lg font-bold">Today’s Hourly Outlook</h2>
          <p className="text-ink-muted mb-3 text-xs">
            Hourly concentration trend translated to indicative India NAQI bands.
          </p>
          <HourlyForecastChart forecast={forecast} />
        </Card>

        <PollutantBreakdownCard subIndices={aqiResult.subIndices} />
      </div>

      <Card className="bg-subtle">
        <div className="text-ink-body flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Shield className="text-brand h-4 w-4" aria-hidden="true" />
            <span>
              <strong>Privacy Guarantee:</strong> Household schedules, protection flags, and indoor
              settings stay locally in IndexedDB. Only coarse city name + AQI summary are sent when
              you ask the AI assistant.
            </span>
          </div>
          <span className="text-brand inline-flex items-center gap-1 font-semibold">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Offline-ready local-first store
          </span>
        </div>
      </Card>
    </div>
  );
}
