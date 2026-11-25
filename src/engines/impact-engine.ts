import { EMISSION_FACTOR_BY_MODE } from '../data/emission-factors.ts';
import type { AQIResult } from '../domain/air-quality/types.ts';
import type { TransportMode } from '../domain/household/types.ts';
import type { ImpactCalculation, ImpactExplanation } from '../domain/impact/types.ts';

export interface TransportComparisonInput {
  id: string;
  originalMode: TransportMode;
  alternativeMode: TransportMode;
  oneWayDistanceKm: number;
  tripsPerWeek: number;
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculates illustrative avoided transport emissions using documented Indian factors.
 * Never derives PM2.5 or NOx from CO2e, and keeps personal exposure strictly separate.
 */
export function calculateTransportImpact(input: TransportComparisonInput): ImpactCalculation {
  const original = EMISSION_FACTOR_BY_MODE.get(input.originalMode);
  const alternative = EMISSION_FACTOR_BY_MODE.get(input.alternativeMode);

  if (
    !original ||
    !alternative ||
    !Number.isFinite(input.oneWayDistanceKm) ||
    input.oneWayDistanceKm <= 0 ||
    !Number.isFinite(input.tripsPerWeek) ||
    input.tripsPerWeek <= 0
  ) {
    return {
      id: input.id,
      impactType: 'transport_emissions',
      originalMode: input.originalMode,
      alternativeMode: input.alternativeMode,
      distanceKm: Math.max(0, input.oneWayDistanceKm),
      tripsPerWeek: Math.max(0, input.tripsPerWeek),
      calculable: false,
      co2eAvoidedKgPerWeek: null,
      pm25AvoidedGramsPerWeek: null,
      noxAvoidedGramsPerWeek: null,
      tripsAvoidedPerWeek: 0,
      assumptions: [],
      limitations: ['Required distance, frequency, or regional emission factor was unavailable.'],
      confidence: 'limited',
      factorIds: [],
      qualitativeFallback:
        'Shifting solo motorized trips to shared transit or remote days generally cuts per-person fuel use, though exact grams cannot be calculated without valid trip inputs.',
    };
  }

  const totalKmPerWeek = roundTo2(input.oneWayDistanceKm * input.tripsPerWeek);
  const co2DiffGramsPerKm = original.co2eGramsPerPassengerKm - alternative.co2eGramsPerPassengerKm;
  const co2eAvoidedKgPerWeek = roundTo2(Math.max(0, (co2DiffGramsPerKm * totalKmPerWeek) / 1000));

  let pm25AvoidedGramsPerWeek: number | null = null;
  if (original.pm25MgPerPassengerKm !== null && alternative.pm25MgPerPassengerKm !== null) {
    const diffMg = original.pm25MgPerPassengerKm - alternative.pm25MgPerPassengerKm;
    pm25AvoidedGramsPerWeek = roundTo2(Math.max(0, (diffMg * totalKmPerWeek) / 1000));
  }

  let noxAvoidedGramsPerWeek: number | null = null;
  if (original.noxMgPerPassengerKm !== null && alternative.noxMgPerPassengerKm !== null) {
    const diffMg = original.noxMgPerPassengerKm - alternative.noxMgPerPassengerKm;
    noxAvoidedGramsPerWeek = roundTo2(Math.max(0, (diffMg * totalKmPerWeek) / 1000));
  }

  const soloVehicleModes: TransportMode[] = [
    'car_petrol',
    'car_diesel',
    'car_cng',
    'car_ev',
    'motorcycle',
  ];
  const avoidsSoloVehicle =
    soloVehicleModes.includes(input.originalMode) &&
    !soloVehicleModes.includes(input.alternativeMode);
  const tripsAvoidedPerWeek = avoidsSoloVehicle ? Math.round(input.tripsPerWeek) : 0;

  const assumptions = [
    `Trip volume: ${input.oneWayDistanceKm} km × ${input.tripsPerWeek} one-way trips/week (${totalKmPerWeek} km/week).`,
    `Baseline (${original.label}): ${original.co2eGramsPerPassengerKm} g CO2e/passenger-km (${original.occupancyAssumption}).`,
    `Alternative (${alternative.label}): ${alternative.co2eGramsPerPassengerKm} g CO2e/passenger-km (${alternative.occupancyAssumption}).`,
  ];

  const limitations = [
    original.limitations,
    alternative.limitations,
    'Uses average regional emission factors rather than marginal dispatch modeling; one household’s shift does not produce a measurable citywide AQI change.',
  ];

  if (pm25AvoidedGramsPerWeek === null || noxAvoidedGramsPerWeek === null) {
    limitations.push(
      'Direct PM2.5/NOx savings are omitted where transit/grid tailpipe factors vary widely; Saansathi never infers PM2.5 from CO2e.',
    );
  }

  return {
    id: input.id,
    impactType: 'transport_emissions',
    originalMode: input.originalMode,
    alternativeMode: input.alternativeMode,
    distanceKm: input.oneWayDistanceKm,
    tripsPerWeek: input.tripsPerWeek,
    calculable: true,
    co2eAvoidedKgPerWeek,
    pm25AvoidedGramsPerWeek,
    noxAvoidedGramsPerWeek,
    tripsAvoidedPerWeek,
    assumptions,
    limitations,
    confidence: pm25AvoidedGramsPerWeek !== null ? 'moderate' : 'limited',
    factorIds: [original.id, alternative.id],
  };
}

/**
 * Generates an independent, transparent explanation separating exposure from emissions.
 */
export function buildImpactExplanation(
  calc: ImpactCalculation,
  aqiResult: AQIResult,
): ImpactExplanation {
  const original = EMISSION_FACTOR_BY_MODE.get(calc.originalMode);
  const alternative = EMISSION_FACTOR_BY_MODE.get(calc.alternativeMode);
  const origLabel = original?.label ?? calc.originalMode;
  const altLabel = alternative?.label ?? calc.alternativeMode;

  const estimatedEnvironmentalImpact =
    calc.calculable && calc.co2eAvoidedKgPerWeek !== null
      ? `Illustrative ~${calc.co2eAvoidedKgPerWeek} kg CO2e/week avoided (${calc.tripsAvoidedPerWeek} solo vehicle trips replaced)${
          calc.pm25AvoidedGramsPerWeek !== null
            ? ` and ~${calc.pm25AvoidedGramsPerWeek} g direct tailpipe PM2.5/week`
            : ''
        }.`
      : (calc.qualitativeFallback ??
        'Qualitative emission reduction; numeric factors unavailable.');

  const aqiVal = aqiResult.value ?? 0;
  let personalExposureConsideration: string;

  if (calc.alternativeMode === 'remote') {
    personalExposureConsideration =
      'Eliminating the road commute avoids peak traffic-corridor PM2.5/NO₂ exposure, assuming your indoor environment is cleaner than outdoor traffic air.';
  } else if (calc.alternativeMode === 'bicycle' || calc.alternativeMode === 'walking') {
    personalExposureConsideration =
      aqiVal > 200
        ? 'Caution: Because current AQI is Poor or worse, active walking/cycling along busy roads increases breathing rate and pollutant intake—not recommended over enclosed transit today.'
        : 'Exposure depends on traffic proximity and route greenery; choose inner lanes away from heavy diesel traffic.';
  } else if (calc.alternativeMode === 'metro') {
    personalExposureConsideration =
      'Avoids driving in open-window congestion, though station platforms and walking last-mile segments still expose passengers to ambient air.';
  } else {
    personalExposureConsideration =
      'Personal exposure may stay similar or change depending on cabin ventilation, waiting time at bus stops/gates, and traffic congestion—do not assume exposure drops automatically.';
  }

  return {
    change: `${origLabel} → ${altLabel}`,
    whyItMatters:
      'Reduces individual motorized vehicle kilometres and local fuel demand on congested urban corridors.',
    estimatedEnvironmentalImpact,
    personalExposureConsideration,
    confidenceSummary:
      calc.confidence === 'moderate'
        ? 'Moderate confidence on CO2e using Indian fleet averages; personal exposure remains qualitative.'
        : 'Limited quantitative precision—regional fleet averages used; treat as directional estimate.',
    howWeCalculated: calc.assumptions,
    limitations: calc.limitations,
  };
}
