import type { HouseholdProfile } from '../domain/household/types.ts';
import type { OutdoorWindow, RoutineRecommendation } from '../domain/routine/types.ts';
import { formatHourRange } from './activity-window.ts';
import { calculateTransportImpact } from './impact-engine.ts';

function isElevatedOrWorse(aqi: number | null): boolean {
  return aqi !== null && aqi > 200;
}

function isModerateOrWorse(aqi: number | null): boolean {
  return aqi !== null && aqi > 100;
}

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

  if (isElevatedOrWorse(aqi) || (hasSensitive && isModerateOrWorse(aqi))) {
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

export function buildCommuteRecommendation(
  profile: HouseholdProfile,
  aqi: number | null,
  category: string,
): RoutineRecommendation | null {
  if (profile.workPattern === 'outdoor_work') {
    return {
      id: 'rec-outdoor-worker',
      period: 'commute_am',
      title: 'Pace heavy outdoor work and follow site occupational safety guidance',
      description:
        aqi !== null && aqi > 200
          ? `Outdoor NAQI is ${aqi} (${category}). Take scheduled breaks in shaded/enclosed spaces where possible, stay hydrated, and check employer or municipal heat/smog advisories.`
          : 'Follow standard workplace safety measures and take breaks away from idling vehicles or dust zones.',
      suggestedTiming: 'Workday shifts',
      relevantContext: 'Outdoor work schedule',
      reason: 'Prolonged outdoor labour increases cumulative inhalation across the workday.',
      exposureEffect:
        'Pacing heavy tasks and stepping away from idling engines lowers peak intake.',
      environmentalImpact: 'Neutral.',
      effort: 'no_cost',
      confidence: 'moderate',
      evidenceIds: ['cpcb-naqi'],
      caveats: [
        'Never bypass required workplace PPE or occupational safety procedures.',
        'Seek medical care immediately for chest pain, dizziness, or severe shortness of breath.',
      ],
      origin: 'deterministic',
      status: 'pending',
    };
  }

  if (
    profile.primaryCommuteMode !== 'car_petrol' &&
    profile.primaryCommuteMode !== 'car_diesel' &&
    profile.primaryCommuteMode !== 'motorcycle'
  ) {
    return null;
  }

  const canHybrid = profile.workPattern === 'hybrid' || profile.workPattern === 'remote';
  const suggestedAlt = canHybrid
    ? 'remote'
    : profile.commuteDistanceKmOneWay >= 6
      ? 'metro'
      : 'carpool';
  const impact = calculateTransportImpact({
    id: 'routine-commute-calc',
    originalMode: profile.primaryCommuteMode,
    alternativeMode: suggestedAlt,
    oneWayDistanceKm: Math.max(1, profile.commuteDistanceKmOneWay),
    tripsPerWeek: canHybrid ? 4 : 6,
  });

  return {
    id: 'rec-commute-shift',
    period: 'commute_am',
    title:
      suggestedAlt === 'remote'
        ? 'Use 2 remote workdays on peak smog days'
        : suggestedAlt === 'metro'
          ? 'Shift 3 round-trip commutes/week to Metro or City Bus'
          : 'Coordinate a 2–3 person carpool on your regular route',
    description:
      suggestedAlt === 'remote'
        ? `With a ${profile.commuteDistanceKmOneWay} km one-way commute and flexible work, working remotely on high-AQI mornings eliminates two road trips.`
        : `Replacing 3 solo ${profile.primaryCommuteMode.replace(/_/g, ' ')} round-trips (${profile.commuteDistanceKmOneWay} km each way) with ${suggestedAlt} cuts per-person tailpipe demand.`,
    suggestedTiming: '08:00 AM – 10:00 AM commute',
    relevantContext: `${profile.commuteDistanceKmOneWay} km commute via ${profile.primaryCommuteMode.replace(/_/g, ' ')}`,
    reason: 'Private motorized commutes contribute to urban traffic congestion, NO₂, and CO₂e.',
    exposureEffect:
      suggestedAlt === 'remote'
        ? 'Reduces time spent in traffic corridors; keep indoor space low-smoke.'
        : 'Exposure depends on transit wait times and last-mile road traffic—do not assume personal intake automatically drops.',
    environmentalImpact:
      impact.co2eAvoidedKgPerWeek !== null
        ? `Estimated ~${impact.co2eAvoidedKgPerWeek} kg CO2e/week avoided (${impact.tripsAvoidedPerWeek} solo trips replaced).`
        : 'Reduces per-person motorized travel emissions.',
    effort: 'low_effort',
    confidence: 'moderate',
    evidenceIds: ['india-ghg-transport'],
    caveats: [
      'We do NOT recommend switching long commutes to cycling/walking when NAQI is Poor or worse.',
      'Calculations use average Indian fleet factors, not individual vehicle telemetry.',
    ],
    alternative: {
      title: 'Off-peak departure + zero idling',
      description:
        'Leave 30 minutes earlier/later to avoid bumper-to-bumper bottlenecks and switch off engine at >15 s red lights.',
      tradeOff: 'Smaller emission reduction than transit, but easy on fixed schedules.',
    },
    origin: 'deterministic',
    status: 'pending',
  };
}
