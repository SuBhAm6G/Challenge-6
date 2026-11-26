import type { EmissionFactor } from '../domain/impact/types.ts';

/**
 * Private motorized vehicle emission factors (WRI India / India GHG Program & CEA grid benchmarks).
 */
export const MOTORIZED_EMISSION_FACTORS: readonly EmissionFactor[] = [
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
] as const;
