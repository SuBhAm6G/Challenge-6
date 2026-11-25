import type { PollutantId } from '../domain/air-quality/types.ts';

export interface PollutantInfo {
  id: PollutantId;
  code: string;
  name: string;
  unit: 'µg/m³' | 'mg/m³';
  cpcbAveragingPeriod: string;
  who24hGuideline: string;
  whatItIs: string;
  commonUrbanSources: string;
  whyItMatters: string;
  indoorNote: string;
}

export const POLLUTANT_CATALOG: Readonly<Record<PollutantId, PollutantInfo>> = {
  pm25: {
    id: 'pm25',
    code: 'PM2.5',
    name: 'Fine Particulate Matter',
    unit: 'µg/m³',
    cpcbAveragingPeriod: '24-hour average (CPCB NAQI)',
    who24hGuideline: '15 µg/m³ (24-hour WHO AQG 2021)',
    whatItIs:
      'Microscopic airborne particles 2.5 micrometres or smaller—roughly 30 times finer than a human hair.',
    commonUrbanSources:
      'Vehicle exhaust, biomass and waste burning, winter crop-residue smoke, construction dust, cooking fumes, and incense.',
    whyItMatters:
      'Because of their small size, fine particles penetrate deep into the lower airways and are a primary driver of winter smog health strain.',
    indoorNote:
      'Enters indoors through gaps and open windows, and is also generated indoors by cooking, incense, mosquito coils, and smoking.',
  },
  pm10: {
    id: 'pm10',
    code: 'PM10',
    name: 'Coarse Particulate Matter',
    unit: 'µg/m³',
    cpcbAveragingPeriod: '24-hour average (CPCB NAQI)',
    who24hGuideline: '45 µg/m³ (24-hour WHO AQG 2021)',
    whatItIs:
      'Inhalable airborne particles up to 10 micrometres in diameter, including dust and soot.',
    commonUrbanSources:
      'Resuspended road dust, unpaved roads, construction and demolition, industrial processes, and combustion particles.',
    whyItMatters:
      'Irritates the eyes, nose, throat, and upper respiratory tract; spikes sharply along busy roads and dry windy afternoons.',
    indoorNote:
      'Settles faster than PM2.5; wet-mopping instead of dry-sweeping prevents re-suspending settled coarse dust indoors.',
  },
  no2: {
    id: 'no2',
    code: 'NO₂',
    name: 'Nitrogen Dioxide',
    unit: 'µg/m³',
    cpcbAveragingPeriod: '24-hour average (CPCB NAQI)',
    who24hGuideline: '25 µg/m³ (24-hour WHO AQG 2021)',
    whatItIs: 'A reactive reddish-brown combustion gas closely tied to motorized traffic.',
    commonUrbanSources:
      'Diesel and petrol vehicle exhaust, traffic congestion corridors, power generation, and unvented gas stoves.',
    whyItMatters:
      'Inflames airways and lowers resistance to respiratory irritation, especially near major intersections and school drop-off zones.',
    indoorNote:
      'Gas cooking without an exhaust hood or cross-ventilation can briefly elevate indoor NO₂ levels.',
  },
  so2: {
    id: 'so2',
    code: 'SO₂',
    name: 'Sulphur Dioxide',
    unit: 'µg/m³',
    cpcbAveragingPeriod: '24-hour average (CPCB NAQI)',
    who24hGuideline: '40 µg/m³ (24-hour WHO AQG 2021)',
    whatItIs: 'A pungent gas produced when sulphur-containing fuels are burned.',
    commonUrbanSources:
      'Coal-fired power plants, industrial boilers, brick kilns, and heavy diesel engines.',
    whyItMatters:
      'Can quickly trigger throat tightness and airway constriction in sensitive individuals.',
    indoorNote: 'Typically lower indoors unless outdoor industrial plumes are strong.',
  },
  co: {
    id: 'co',
    code: 'CO',
    name: 'Carbon Monoxide',
    unit: 'mg/m³',
    cpcbAveragingPeriod: '8-hour average (CPCB NAQI)',
    who24hGuideline: '4 mg/m³ (24-hour WHO AQG 2021)',
    whatItIs: 'A colourless, odourless gas formed by incomplete burning of carbon fuels.',
    commonUrbanSources:
      'Idling vehicles, congested traffic, biomass heaters, and poorly ventilated combustion appliances.',
    whyItMatters:
      'Reduces oxygen delivery in the bloodstream; high indoor levels from unvented heaters or charcoal braziers are an acute safety hazard.',
    indoorNote:
      'Never seal rooms tightly when using gas stoves, geysers, or any fuel-burning heater.',
  },
  o3: {
    id: 'o3',
    code: 'O₃',
    name: 'Ground-Level Ozone',
    unit: 'µg/m³',
    cpcbAveragingPeriod: '8-hour average (CPCB NAQI)',
    who24hGuideline: '100 µg/m³ (8-hour peak WHO AQG 2021)',
    whatItIs: 'A secondary gas formed when sunlight reacts with traffic and solvent emissions.',
    commonUrbanSources:
      'Photochemical reactions of NOₓ and volatile organic compounds on sunny afternoons.',
    whyItMatters:
      'Even when winter mornings are foggy, sunny afternoons can elevate ozone, irritating airways during outdoor exercise.',
    indoorNote: 'Avoid ozone-generating air cleaners—they emit ozone directly into occupied rooms.',
  },
};
