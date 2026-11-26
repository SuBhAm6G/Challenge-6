import type { TransportMode } from '../domain/household/types.ts';
import type { EmissionFactor } from '../domain/impact/types.ts';
import { MOTORIZED_EMISSION_FACTORS } from './motorized-emission-factors.ts';

const SHARED_AND_ACTIVE_FACTORS: readonly EmissionFactor[] = [
  {
    id: 'in-auto-cng',
    mode: 'auto_cng',
    label: 'CNG Auto-Rickshaw',
    source: 'WRI India / India GHG Program Road Transport Emission Factors',
    sourceUrl:
      'https://indiaghgp.org/sites/default/files/India%20Specific%20Road%20Transport%20Emission%20Factors.pdf',
    region: 'India',
    publicationYear: 2015,
    vehicleCategory: 'Three-Wheeler (CNG)',
    fuelOrEnergy: 'CNG',
    co2eGramsPerPassengerKm: 68,
    pm25MgPerPassengerKm: 3,
    noxMgPerPassengerKm: 95,
    occupancyAssumption: '1.5 passengers',
    methodology: 'Urban three-wheeler CNG factor divided by average occupancy.',
    limitations: 'Open cabin exposes riders to surrounding road dust and tailpipe exhaust.',
  },
  {
    id: 'in-bus',
    mode: 'bus',
    label: 'City Bus (CNG / Electric / Diesel Fleet)',
    source: 'WRI India / India GHG Program Public Bus Factor',
    sourceUrl:
      'https://indiaghgp.org/sites/default/files/India%20Specific%20Road%20Transport%20Emission%20Factors.pdf',
    region: 'India',
    publicationYear: 2015,
    vehicleCategory: 'Urban Stage Carriage Bus',
    fuelOrEnergy: 'Mixed Urban Bus Fleet',
    co2eGramsPerPassengerKm: 28,
    pm25MgPerPassengerKm: null,
    noxMgPerPassengerKm: null,
    occupancyAssumption: 'Average 32 passengers across peak and off-peak',
    methodology: 'Per-vehicle emission factor divided by typical Indian urban bus occupancy.',
    limitations:
      'Average factor, not marginal: one extra rider on a scheduled bus adds negligible direct emissions while avoiding one private vehicle trip.',
  },
  {
    id: 'in-metro',
    mode: 'metro',
    label: 'Urban Metro Rail',
    source: 'Indian Metro Rail Sustainability Benchmarks & CEA Grid Intensity',
    sourceUrl:
      'https://indiaghgp.org/sites/default/files/India%20Specific%20Road%20Transport%20Emission%20Factors.pdf',
    region: 'India',
    publicationYear: 2023,
    vehicleCategory: 'Electric Rapid Transit',
    fuelOrEnergy: 'Grid + Solar Traction Mix',
    co2eGramsPerPassengerKm: 19,
    pm25MgPerPassengerKm: null,
    noxMgPerPassengerKm: null,
    occupancyAssumption: 'Average urban metro load factor',
    methodology:
      'Traction energy per passenger-km using average grid intensity; zero street-level tailpipe emissions.',
    limitations:
      'Last-mile connector mode matters; underground stations and crowded platforms have variable particulate levels.',
  },
  {
    id: 'in-bicycle',
    mode: 'bicycle',
    label: 'Bicycle',
    source: 'Zero direct operational fuel combustion',
    sourceUrl:
      'https://indiaghgp.org/sites/default/files/India%20Specific%20Road%20Transport%20Emission%20Factors.pdf',
    region: 'India',
    publicationYear: 2023,
    vehicleCategory: 'Active Non-Motorized',
    fuelOrEnergy: 'Human-powered',
    co2eGramsPerPassengerKm: 0,
    pm25MgPerPassengerKm: 0,
    noxMgPerPassengerKm: 0,
    occupancyAssumption: '1 rider',
    methodology: 'Zero direct tailpipe/operational emissions.',
    limitations:
      'During Poor/Very Poor/Severe AQI, elevated breathing rates near traffic increase personal pollution intake—not recommended for long smog commutes.',
  },
  {
    id: 'in-walking',
    mode: 'walking',
    label: 'Walking',
    source: 'Zero direct operational fuel combustion',
    sourceUrl:
      'https://indiaghgp.org/sites/default/files/India%20Specific%20Road%20Transport%20Emission%20Factors.pdf',
    region: 'India',
    publicationYear: 2023,
    vehicleCategory: 'Active Non-Motorized',
    fuelOrEnergy: 'Human-powered',
    co2eGramsPerPassengerKm: 0,
    pm25MgPerPassengerKm: 0,
    noxMgPerPassengerKm: 0,
    occupancyAssumption: '1 person',
    methodology: 'Zero operational emissions.',
    limitations:
      'Prefer shaded, low-traffic lanes and avoid strenuous walks during Severe episodes.',
  },
  {
    id: 'in-remote',
    mode: 'remote',
    label: 'Work / Attend Remotely',
    source: 'Avoided Motorized Commute Baseline',
    sourceUrl:
      'https://indiaghgp.org/sites/default/files/India%20Specific%20Road%20Transport%20Emission%20Factors.pdf',
    region: 'India',
    publicationYear: 2023,
    vehicleCategory: 'Telecommute',
    fuelOrEnergy: 'Home electricity only (marginal)',
    co2eGramsPerPassengerKm: 0,
    pm25MgPerPassengerKm: 0,
    noxMgPerPassengerKm: 0,
    occupancyAssumption: 'Trip avoided',
    methodology:
      'Avoids commute tailpipe emissions entirely; minor home device energy is not subtracted unless metered.',
    limitations: 'Only feasible for desk/knowledge roles or online meetings.',
  },
] as const;

/**
 * Documented Indian transport emission factors.
 * Missing tailpipe PM2.5 / NOx figures remain `null` rather than being fabricated from CO2e.
 */
export const INDIA_EMISSION_FACTORS: readonly EmissionFactor[] = [
  ...MOTORIZED_EMISSION_FACTORS,
  ...SHARED_AND_ACTIVE_FACTORS,
];

export const EMISSION_FACTOR_BY_MODE: ReadonlyMap<TransportMode, EmissionFactor> = new Map(
  INDIA_EMISSION_FACTORS.map((f) => [f.mode, f]),
);
