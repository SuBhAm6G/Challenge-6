import type { HouseholdProfile } from '../domain/household/types.ts';
import type { OutdoorWindow, RoutineRecommendation } from '../domain/routine/types.ts';
import { formatHourRange } from './activity-window.ts';
import { buildCommuteRecommendation } from './routine-commute-rules.ts';

export { buildCommuteRecommendation };

/**
 * Generates the morning outdoor exercise recommendation tailored to AQI and priority protection flags.
 */
export function buildMorningRecommendation(
  profile: HouseholdProfile,
  aqi: number | null,
  category: string,
  bestWindow: OutdoorWindow | undefined,
): RoutineRecommendation | null {
  if (profile.outdoorExerciseHabit === 'none') return null;
  const hasSensitive = profile.protectionFlags.length > 0;

  if (aqi === null) {
    return {
      id: 'rec-morning-unavailable',
      period: 'morning',
      title: 'Check local visibility before morning outdoor exercise',
      description:
        'Current AQI data is unavailable. Keep morning outdoor exertion moderate or choose indoor stretching if haze or smoke odour is noticeable.',
      suggestedTiming: '06:00 AM – 08:00 AM',
      relevantContext: `Exercise habit: ${profile.outdoorExerciseHabit.replace(/_/g, ' ')}`,
      reason: 'Live/forecast AQI data could not be verified at this time.',
      exposureEffect: 'Reduces risk of high breathing-rate intake during unverified smog.',
      environmentalImpact: 'No direct transport emission change.',
      effort: 'no_cost',
      confidence: 'limited',
      evidenceIds: ['cpcb-naqi'],
      caveats: ['Missing air-quality reading; verify conditions visually or retry data fetch.'],
      origin: 'deterministic',
      status: 'pending',
    };
  }

  if (aqi > 200 || (hasSensitive && aqi > 100)) {
    const windowTip = bestWindow
      ? `If outdoor movement is essential, the forecast suggests a comparatively lower-AQI dip around ${formatHourRange(bestWindow.startHour, bestWindow.endHour)} (est. NAQI ~${bestWindow.averageEstimatedAqi}), though conditions may still be elevated.`
      : 'No substantially cleaner outdoor window is identified in the current forecast.';

    return {
      id: 'rec-morning-indoor-swap',
      period: 'morning',
      title: 'Move strenuous morning exercise indoors',
      description: `Today’s NAQI is ${aqi} (${category}). Replace brisk outdoor running or jogging with indoor yoga, stair climbs, or resistance circuits. ${windowTip}`,
      suggestedTiming: bestWindow
        ? `Indoor morning, or light stroll ${formatHourRange(bestWindow.startHour, bestWindow.endHour)}`
        : 'Indoors during morning peak',
      relevantContext: hasSensitive
        ? 'Household includes priority protection members'
        : `Current ${category} air quality`,
      reason: `Morning winter inversion often traps PM2.5 near ground level; heavy breathing during ${category} AQI increases particulate intake.`,
      exposureEffect:
        'Helps avoid elevated deep-lung particulate intake during high-breathing exertion.',
      environmentalImpact: 'Neutral direct emissions.',
      effort: 'no_cost',
      confidence: 'high',
      evidenceIds: ['cpcb-naqi', 'who-aqg-2021'],
      caveats: [
        'Indoor air is only cleaner if indoor burning/smoking is avoided.',
        'Forecast windows come from a ~11 km grid model and do not guarantee safe conditions.',
      ],
      alternative: bestWindow
        ? {
            title: 'Short gentle walk in afternoon dip',
            description: `Take a 15–20 minute slow walk away from main roads around ${formatHourRange(bestWindow.startHour, bestWindow.endHour)}.`,
            tradeOff: 'Still carries outdoor exposure if NAQI remains above 200.',
          }
        : undefined,
      origin: 'deterministic',
      status: 'pending',
    };
  }

  return {
    id: 'rec-morning-park-route',
    period: 'morning',
    title: 'Keep outdoor exercise away from main traffic roads',
    description: `NAQI is ${aqi} (${category}). Outdoor activity is generally reasonable; prefer interior parks or residential lanes at least 100 m away from diesel traffic.`,
    suggestedTiming: '06:30 AM – 08:30 AM',
    relevantContext: `Current NAQI ${aqi} (${category})`,
    reason: 'Roadside NO₂ and dust concentrations drop sharply within 50–100 m of busy corridors.',
    exposureEffect: 'Lowers peak traffic-plume exposure without cancelling outdoor fitness.',
    environmentalImpact: 'Zero-emission recreation.',
    effort: 'no_cost',
    confidence: 'moderate',
    evidenceIds: ['cpcb-naqi', 'who-aqg-2021'],
    caveats: ['Monitor breathlessness if anyone in the household is sensitive.'],
    origin: 'deterministic',
    status: 'pending',
  };
}
