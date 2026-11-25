import { AlertTriangle, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import { evaluateCleanAirAlerts } from '../../engines/alert-engine.ts';
import { evaluateReadingFreshness } from '../../engines/freshness.ts';
import { evaluateVentilationGuidance } from '../../engines/indoor-engine.ts';
import { generateDailyRoutine } from '../../engines/routine-engine.ts';
import { useAppStore } from '../../store/useAppStore.ts';
import { Card, PrimaryButton, SecondaryButton } from '../ui/Primitives.tsx';
import { AlertsCard } from './AlertsCard.tsx';
import { AqiHeroCard } from './AqiHeroCard.tsx';
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
  } = useAppStore();

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
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#1C1917]">
                Today’s Priority Actions for {householdProfile.name}
              </h2>
              <p className="text-xs text-[#57534E]">
                Deterministic context engine • Adapted to your commute, schedule, and protection
                settings
              </p>
            </div>
            <SecondaryButton type="button" onClick={() => setRoute('routine')}>
              Full Timeline <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </SecondaryButton>
          </div>

          <div className="mt-4 space-y-3">
            {routine.slice(0, 3).map((rec) => {
              const status = routineStatuses[rec.id] ?? rec.status;
              return (
                <div key={rec.id} className="rounded-xl border border-[#E4DCCD] bg-[#FAF7F2] p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold tracking-wide text-[#0F6E56] uppercase">
                        {rec.suggestedTiming}
                      </span>
                      <h3 className="text-sm font-bold text-[#1C1917] sm:text-base">{rec.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setRoutineStatus(rec.id, status === 'completed' ? 'pending' : 'completed')
                      }
                      className={`min-h-[36px] rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                        status === 'completed'
                          ? 'border-[#0F6E56] bg-[#0F6E56] text-white'
                          : 'border-[#D6CCBA] bg-white text-[#1C1917] hover:bg-[#EFE8DA]'
                      }`}
                    >
                      {status === 'completed' ? 'Completed' : 'Mark Done'}
                    </button>
                  </div>
                  <p className="mt-1.5 text-sm text-[#44403C]">{rec.description}</p>
                  <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded-lg bg-white p-2 text-[#1C1917]">
                      <strong className="text-[#0F6E56]">Exposure:</strong> {rec.exposureEffect}
                    </div>
                    <div className="rounded-lg bg-white p-2 text-[#1C1917]">
                      <strong className="text-[#B45309]">Emissions:</strong>{' '}
                      {rec.environmentalImpact}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <h2 className="text-base font-bold text-[#1C1917]">Indoor Air & Ventilation</h2>
            <p className="mt-1 text-sm font-semibold text-[#0F6E56]">{ventilation.headline}</p>
            <p className="mt-1 text-xs text-[#44403C]">{ventilation.explanation}</p>
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
            <h2 className="text-base font-bold text-[#1C1917]">Impact Overview (Separate)</h2>
            <p className="mt-0.5 text-xs text-[#57534E]">
              Exposure protection and emission reductions are never combined into one arbitrary
              score.
            </p>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="rounded-xl border border-[#E4DCCD] bg-[#FAF7F2] p-3">
                <p className="font-bold text-[#0F6E56]">1. Personal Exposure Management</p>
                <p className="mt-0.5 text-[#1C1917]">
                  {completedRoutineCount} of {routine.length} routine adjustments active •{' '}
                  {completedIndoorActionIds.length} indoor habits checked
                </p>
              </div>
              <div className="rounded-xl border border-[#E4DCCD] bg-[#FAF7F2] p-3">
                <p className="font-bold text-[#B45309]">2. Estimated Avoided Emissions</p>
                <p className="mt-0.5 text-[#1C1917]">
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
          <h2 className="text-lg font-bold text-[#1C1917]">Today’s Hourly Outlook</h2>
          <p className="mb-3 text-xs text-[#57534E]">
            Hourly concentration trend translated to indicative India NAQI bands.
          </p>
          <HourlyForecastChart forecast={forecast} />
        </Card>

        <PollutantBreakdownCard subIndices={aqiResult.subIndices} />
      </div>

      <Card className="bg-[#F3EDE2]">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#44403C]">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#0F6E56]" aria-hidden="true" />
            <span>
              <strong>Privacy Guarantee:</strong> Household schedules, protection flags, and indoor
              settings stay locally in IndexedDB. Only coarse city name + AQI summary are sent when
              you ask the AI assistant.
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-semibold text-[#0F6E56]">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Offline-ready local-first store
          </span>
        </div>
      </Card>
    </div>
  );
}
