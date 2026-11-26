import type { HouseholdProfile } from '../domain/household/types.ts';
import type { RoutineRecommendation } from '../domain/routine/types.ts';
import { calculateTransportImpact } from './impact-engine.ts';

/**
 * Generates morning commute or outdoor-work pacing adjustments based on household profile and NAQI.
 */
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
