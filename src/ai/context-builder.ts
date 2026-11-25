import type {
  AirQualityForecast,
  AirQualityReading,
  AQIResult,
} from '../domain/air-quality/types.ts';
import type { HouseholdProfile, LocationPreset } from '../domain/household/types.ts';
import type { IndoorProfile } from '../domain/indoor/types.ts';
import type { RoutineRecommendation } from '../domain/routine/types.ts';
import { findBestOutdoorWindows, formatHourRange } from '../engines/activity-window.ts';
import type { AiContextPackage } from './schemas.ts';

/**
 * Constructs a privacy-minimized, bounded AI context package.
 * Strips precise street locality/coordinates, personal household names, and medical details.
 */
export function buildAiContextPackage(params: {
  location: LocationPreset;
  reading: AirQualityReading | null;
  aqiResult: AQIResult;
  forecast: AirQualityForecast | null;
  household: HouseholdProfile;
  indoor: IndoorProfile;
  deterministicRoutine: RoutineRecommendation[];
}): AiContextPackage {
  const { location, reading, aqiResult, forecast, household, indoor, deterministicRoutine } =
    params;

  const windows = findBestOutdoorWindows(forecast);
  const bestWindow = windows[0];
  const bestOutdoorWindowLabel = bestWindow
    ? `${formatHourRange(bestWindow.startHour, bestWindow.endHour)} (est. NAQI ~${bestWindow.averageEstimatedAqi})`
    : null;

  const pollutantSummary =
    aqiResult.subIndices.length > 0
      ? aqiResult.subIndices
          .slice(0, 4)
          .map(
            (s) =>
              `${s.pollutant.toUpperCase()}: ${s.concentration} ${s.unit} (sub-index ${s.subIndex})`,
          )
          .join('; ')
      : 'Pollutant measurements unavailable';

  return {
    // City-level precision only — never transmit street coordinates or home addresses to AI
    city: location.city,
    aqiStandard: 'India NAQI (CPCB)',
    aqiValue: aqiResult.value,
    aqiCategory: aqiResult.category,
    dominantPollutant: aqiResult.dominantPollutant
      ? aqiResult.dominantPollutant.toUpperCase()
      : null,
    pollutantSummary: pollutantSummary.slice(0, 395),
    dataSourceLabel: reading ? reading.sourceName.slice(0, 115) : 'No source available',
    isForecastOrSample: reading ? reading.forecastVsObserved : 'unavailable',
    observationTimeIso: reading ? reading.observationTime : null,
    bestOutdoorWindowLabel,
    householdSummary: {
      memberCount: household.memberCount,
      commuteMode: household.primaryCommuteMode,
      commuteDistanceKm: household.commuteDistanceKmOneWay,
      workPattern: household.workPattern,
      hasSchoolChildren: household.hasSchoolGoingChildren,
      hasPriorityProtectionMembers: household.protectionFlags.length > 0,
      exerciseHabit: household.outdoorExerciseHabit,
      budget: household.budget,
    },
    indoorSummary: {
      hasPurifier: indoor.hasAirPurifier,
      cookingFuel: indoor.cookingFuel,
      hasKitchenExhaust: indoor.hasKitchenExhaustOrChimney,
      hasIndoorBurningSources: indoor.burningSources.length > 0,
    },
    deterministicHighlights: deterministicRoutine
      .slice(0, 5)
      .map((r) => `${r.title} (${r.suggestedTiming})`.slice(0, 175)),
  };
}
