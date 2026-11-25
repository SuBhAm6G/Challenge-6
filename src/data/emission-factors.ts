import type { EmissionFactor } from '../domain/impact/types.ts';
import type { TransportMode } from '../domain/household/types.ts';

/**
 * Documented Indian transport emission factors.
 * Where pollutant-specific PM2.5 or NOx per passenger-km values vary widely by vehicle age/BS-norm
 * and cannot be reliably pinned to a single figure without vehicle telemetry, they are left `null`
 * rather than fabricated or derived from CO2e.
 */
export const INDIA_EMISSION_FACTORS: readonly EmissionFactor[] = [
  {
    id: 'in-car-petrol',
    mode: 'car_petrol',
    label: 'Solo Petrol Car',
    source: 'WRI India / India GHG Program Road Transport Emission Factors',
    sourceUrl:
      'https://indiaghgp.org/sites/default/files/India%20Specific%20Road%20Transport%20Emission%20Factors.pdf',
    region: 'India',
    publicationYear: 2015,
    vehicleCategory: 'Passenger Car (Petrol, 1.0–1.4L)',
    fuelOrEnergy: 'Petrol',
    co2eGramsPerPassengerKm: 155,
    pm25MgPerPassengerKm: 5,
    noxMgPerPassengerKm: 180,
    occupancyAssumption: '1.0 passenger (solo commute)',
    methodology: 'Tank-to-wheel fuel consumption factor divided by assumed occupancy of 1.',
    limitations:
      'Older pre-BS6 cars or heavy winter idling emit more; AC load and congestion change real fuel burn.',
  },
  {
    id: 'in-car-diesel',
    mode: 'car_diesel',
    label: 'Solo Diesel Car',
    source: 'WRI India / India GHG Program Road Transport Emission Factors',
    sourceUrl:
      'https://indiaghgp.org/sites/default/files/India%20Specific%20Road%20Transport%20Emission%20Factors.pdf',
    region: 'India',
    publicationYear: 2015,
    vehicleCategory: 'Passenger Car (Diesel)',
    fuelOrEnergy: 'Diesel',
    co2eGramsPerPassengerKm: 148,
    pm25MgPerPassengerKm: 28,
    noxMgPerPassengerKm: 420,
    occupancyAssumption: '1.0 passenger (solo commute)',
    methodology:
      'Tank-to-wheel emission factor with conservative urban diesel PM2.5/NOx intensity.',
    limitations:
      'BS6 DPF-equipped vehicles emit substantially lower PM2.5 than BS4/older diesel vehicles.',
  },
  {
    id: 'in-car-cng',
    mode: 'car_cng',
    label: 'Solo CNG Car',
    source: 'WRI India / India GHG Program Road Transport Emission Factors',
    sourceUrl:
      'https://indiaghgp.org/sites/default/files/India%20Specific%20Road%20Transport%20Emission%20Factors.pdf',
    region: 'India',
    publicationYear: 2015,
    vehicleCategory: 'Passenger Car (CNG)',
    fuelOrEnergy: 'Compressed Natural Gas',
    co2eGramsPerPassengerKm: 122,
    pm25MgPerPassengerKm: 2,
    noxMgPerPassengerKm: 140,
    occupancyAssumption: '1.0 passenger',
    methodology: 'Tank-to-wheel CNG combustion factor.',
    limitations: 'Does not include upstream methane leakage.',
  },
  {
    id: 'in-car-ev',
    mode: 'car_ev',
    label: 'Solo Electric Car',
    source: 'Central Electricity Authority (CEA) Grid Factor + Indian EV Fleet Benchmark',
    sourceUrl:
      'https://indiaghgp.org/sites/default/files/India%20Specific%20Road%20Transport%20Emission%20Factors.pdf',
    region: 'India',
    publicationYear: 2023,
    vehicleCategory: 'Electric Passenger Car (~0.15 kWh/km)',
    fuelOrEnergy: 'Indian Grid Electricity',
    co2eGramsPerPassengerKm: 108,
    pm25MgPerPassengerKm: null,
    noxMgPerPassengerKm: null,
    occupancyAssumption: '1.0 passenger',
    methodology:
      'Average Indian grid intensity (~0.71 kg CO2/kWh) applied to 0.15 kWh/km; zero tailpipe exhaust.',
    limitations:
      'Zero tailpipe emissions, though non-exhaust brake/tyre dust remains and power-plant emissions occur at generation sites.',
  },
  {
    id: 'in-carpool',
    mode: 'carpool',
    label: 'Shared Carpool (2.5 avg riders)',
    source: 'Derived from WRI India Petrol Car Factor',
    sourceUrl:
      'https://indiaghgp.org/sites/default/files/India%20Specific%20Road%20Transport%20Emission%20Factors.pdf',
    region: 'India',
    publicationYear: 2015,
    vehicleCategory: 'Shared Passenger Car',
    fuelOrEnergy: 'Petrol / Mixed',
    co2eGramsPerPassengerKm: 62,
    pm25MgPerPassengerKm: 2,
    noxMgPerPassengerKm: 72,
    occupancyAssumption: '2.5 passengers sharing one existing car trip',
    methodology: 'Single car factor divided by 2.5 occupants.',
    limitations:
      'Assumes the shared trip replaces separate solo vehicle trips rather than creating extra detour km.',
  },
  {
    id: 'in-motorcycle',
    mode: 'motorcycle',
    label: 'Two-Wheeler / Scooter',
    source: 'WRI India / India GHG Program Road Transport Emission Factors',
    sourceUrl:
      'https://indiaghgp.org/sites/default/files/India%20Specific%20Road%20Transport%20Emission%20Factors.pdf',
    region: 'India',
    publicationYear: 2015,
    vehicleCategory: 'Motorized Two-Wheeler (100–150cc)',
    fuelOrEnergy: 'Petrol',
    co2eGramsPerPassengerKm: 42,
    pm25MgPerPassengerKm: 12,
    noxMgPerPassengerKm: 110,
    occupancyAssumption: '1.1 passengers',
    methodology: 'Average Indian two-wheeler fuel consumption factor.',
    limitations:
      'Riders experience high direct traffic-corridor exposure compared to enclosed metro/bus cabins.',
  },
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

export const EMISSION_FACTOR_BY_MODE: ReadonlyMap<TransportMode, EmissionFactor> = new Map(
  INDIA_EMISSION_FACTORS.map((f) => [f.mode, f]),
);
