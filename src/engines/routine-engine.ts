import type { AirQualityForecast, AQIResult } from '../domain/air-quality/types.ts';
import type { HouseholdProfile } from '../domain/household/types.ts';
import type { RoutineRecommendation } from '../domain/routine/types.ts';
import { findBestOutdoorWindows, formatHourRange } from './activity-window.ts';
import { buildCommuteRecommendation, buildMorningRecommendation } from './routine-rules.ts';

/**
 * Deterministic daily routine engine.
 * Adapts to AQI severity, hourly forecast windows, household schedule, commute mode,
 * school-going children, outdoor work, and optional protection flags.
 */
export function generateDailyRoutine(
  profile: HouseholdProfile,
  aqiResult: AQIResult,
  forecast: AirQualityForecast | null,
): RoutineRecommendation[] {
  const aqi = aqiResult.value;
  const category = aqiResult.category ?? 'Unavailable';
  const bestWindow = findBestOutdoorWindows(forecast)[0];
  const recommendations: RoutineRecommendation[] = [];

  const morning = buildMorningRecommendation(profile, aqi, category, bestWindow);
  if (morning) recommendations.push(morning);

  const commute = buildCommuteRecommendation(profile, aqi, category);
  if (commute) recommendations.push(commute);

  if (profile.hasSchoolGoingChildren) {
    recommendations.push({
      id: 'rec-school-planning',
      period: 'afternoon',
      title:
        aqi !== null && aqi > 200
          ? 'Shift afternoon outdoor play indoors & avoid idling at school gates'
          : 'Plan school drop-off with engine-off gate discipline',
      description:
        aqi !== null && aqi > 200
          ? `With NAQI at ${aqi} (${category}), pause intense after-school playground sports and switch off vehicle engines while waiting near school gates.`
          : 'Turn off car/auto engines while waiting during pickup and encourage indoor hydration after dusty playground play.',
      suggestedTiming: '02:30 PM – 04:30 PM',
      relevantContext: 'Household has school-going children',
      reason:
        'Children breathe faster per kg body weight and face concentrated tailpipe exhaust at pickup queues.',
      exposureEffect: 'Reduces concentrated gate-exhaust inhalation and afternoon smog strain.',
      environmentalImpact: 'Cutting 5 minutes of daily idling saves fuel and unnecessary exhaust.',
      effort: 'no_cost',
      confidence: 'high',
      evidenceIds: ['cpcb-naqi', 'who-aqg-2021'],
      caveats: [
        'Check your school’s official outdoor-activity circulars; no measure guarantees zero exposure.',
      ],
      origin: 'deterministic',
      status: 'pending',
    });
  }

  recommendations.push({
    id: 'rec-errands-batch',
    period: 'errands',
    title: 'Consolidate evening errands into one loop during daylight if possible',
    description:
      bestWindow && aqi !== null && aqi > 150
        ? `Combine grocery, pharmacy, and local errands into a single trip around ${formatHourRange(bestWindow.startHour, bestWindow.endHour)} rather than multiple cold-start evening drives.`
        : 'Batch weekly grocery and market runs into one combined trip or shared neighbourhood order.',
    suggestedTiming: bestWindow
      ? formatHourRange(bestWindow.startHour, bestWindow.endHour)
      : '05:00 PM – 06:30 PM',
    relevantContext: `${profile.memberCount}-member household errands`,
    reason:
      'Short cold-start trips emit disproportionately higher pollutants per km and add evening traffic exposure.',
    exposureEffect: 'Fewer short trips outside during evening boundary-layer cooling.',
    environmentalImpact: 'Avoids cold-start fuel burn and duplicate vehicle kilometres.',
    effort: 'no_cost',
    confidence: 'moderate',
    evidenceIds: ['india-ghg-transport'],
    caveats: ['Adjust around essential medical or perishable needs.'],
    origin: 'deterministic',
    status: 'pending',
  });

  recommendations.push({
    id: 'rec-evening-winddown',
    period: 'evening',
    title:
      aqi !== null && aqi > 200
        ? 'Keep evening windows closed during inversion & avoid indoor burning'
        : 'Review kitchen exhaust and tomorrow’s forecast before bed',
    description:
      aqi !== null && aqi > 200
        ? 'After sunset, cooler air traps urban smoke near ground level. Latch exterior windows, run kitchen exhaust while cooking dinner, and skip incense or mosquito coils.'
        : 'Use kitchen exhaust while cooking dinner and review tomorrow morning’s forecast before setting alarms.',
    suggestedTiming: '07:00 PM – 10:00 PM',
    relevantContext: `${category} evening conditions`,
    reason: 'Evening cooling regularly causes sharp PM2.5 rises in Indian cities.',
    exposureEffect: 'Helps keep sleeping rooms lower in particulate accumulation overnight.',
    environmentalImpact: 'Zero-cost household habit.',
    effort: 'no_cost',
    confidence: 'high',
    evidenceIds: ['epa-cleaner-room', 'epa-air-cleaners'],
    caveats: ['Never block ventilation in rooms with unvented gas appliances or heaters.'],
    origin: 'deterministic',
    status: 'pending',
  });

  return recommendations;
}
