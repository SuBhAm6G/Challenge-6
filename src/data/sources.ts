export interface SourceRecord {
  id: string;
  name: string;
  organization: string;
  url: string;
  subject: string;
  applicableRegion: string;
  publicationDate: string;
  lastReviewedDate: string;
  evidenceType:
    | 'regulatory_standard'
    | 'api_documentation'
    | 'health_guideline'
    | 'technical_guide'
    | 'emission_inventory';
  relevantModules: string[];
}

export const SOURCE_REGISTRY: readonly SourceRecord[] = [
  {
    id: 'cpcb-naqi',
    name: 'National Air Quality Index (NAQI)',
    organization: 'Central Pollution Control Board (CPCB), India',
    url: 'https://app.cpcbccr.com/ccr_docs/About_AQI.pdf',
    subject:
      'Indian AQI breakpoints, sub-index linear interpolation, minimum 3-pollutant coverage rule, and 6 health categories',
    applicableRegion: 'India',
    publicationDate: '2014',
    lastReviewedDate: '2026-11-25',
    evidenceType: 'regulatory_standard',
    relevantModules: ['aqi-interpreter', 'routine-engine', 'alert-engine'],
  },
  {
    id: 'open-meteo-aq',
    name: 'Open-Meteo Air Quality API',
    organization: 'Open-Meteo (CAMS / Copernicus Atmospheric Monitoring Service)',
    url: 'https://open-meteo.com/en/docs/air-quality-api',
    subject:
      'Hourly model-based concentrations and forecasts (~11 km grid resolution) for PM2.5, PM10, NO2, SO2, CO, and O3',
    applicableRegion: 'Global (model grid ~11 km)',
    publicationDate: '2024',
    lastReviewedDate: '2026-11-25',
    evidenceType: 'api_documentation',
    relevantModules: ['open-meteo-provider', 'activity-window', 'freshness'],
  },
  {
    id: 'who-aqg-2021',
    name: 'WHO Global Air Quality Guidelines (2021)',
    organization: 'World Health Organization',
    url: 'https://www.who.int/news-room/questions-and-answers/item/who-global-air-quality-guidelines',
    subject:
      'Health-based guideline concentration levels and averaging periods (distinct from national regulatory AQI)',
    applicableRegion: 'Global scientific reference',
    publicationDate: '2021',
    lastReviewedDate: '2026-11-25',
    evidenceType: 'health_guideline',
    relevantModules: ['pollutants', 'routine-engine', 'ai-safety'],
  },
  {
    id: 'epa-air-cleaners',
    name: 'Guide to Air Cleaners in the Home',
    organization: 'US Environmental Protection Agency (EPA)',
    url: 'https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home',
    subject:
      'Portable air cleaners, HEPA/MERV filtration, CADR room sizing, filter maintenance, and source control',
    applicableRegion: 'Technical indoor air guidance',
    publicationDate: '2024',
    lastReviewedDate: '2026-11-25',
    evidenceType: 'technical_guide',
    relevantModules: ['indoor-engine', 'indoor-actions'],
  },
  {
    id: 'epa-cleaner-room',
    name: 'Creating a Cleaner Air Room at Home',
    organization: 'US Environmental Protection Agency (EPA)',
    url: 'https://www.epa.gov/wildfires/how-create-cleaner-air-room-home',
    subject:
      'Designating one low-source, filtered room during high-particulate outdoor episodes with safe ventilation',
    applicableRegion: 'Technical indoor air guidance (adapted for urban smog)',
    publicationDate: '2024',
    lastReviewedDate: '2026-11-25',
    evidenceType: 'technical_guide',
    relevantModules: ['indoor-engine', 'indoor-actions'],
  },
  {
    id: 'epa-ozone-caution',
    name: 'Air Cleaners, HVAC Filters, and Ozone Safety',
    organization: 'US Environmental Protection Agency (EPA)',
    url: 'https://www.epa.gov/indoor-air-quality-iaq/air-cleaners-hvac-filters-and-respiratory-viruses',
    subject:
      'Prohibition of intentional ozone-generating air cleaners in occupied spaces and caution on unverified ionizers',
    applicableRegion: 'Technical indoor air safety',
    publicationDate: '2024',
    lastReviewedDate: '2026-11-25',
    evidenceType: 'technical_guide',
    relevantModules: ['indoor-engine', 'ai-safety'],
  },
  {
    id: 'india-ghg-transport',
    name: 'India Specific Road Transport Emission Factors (WRI India / India GHG Program)',
    organization: 'WRI India, CII, and TERI',
    url: 'https://indiaghgp.org/sites/default/files/India%20Specific%20Road%20Transport%20Emission%20Factors.pdf',
    subject:
      'Passenger-km CO2e and tailpipe pollutant emission factors for Indian cars, two-wheelers, buses, and three-wheelers',
    applicableRegion: 'India',
    publicationDate: '2015',
    lastReviewedDate: '2026-11-25',
    evidenceType: 'emission_inventory',
    relevantModules: ['emission-factors', 'impact-engine'],
  },
] as const;

export const SOURCE_BY_ID: ReadonlyMap<string, SourceRecord> = new Map(
  SOURCE_REGISTRY.map((src) => [src.id, src]),
);

export const VALID_SOURCE_IDS = new Set<string>(SOURCE_REGISTRY.map((src) => src.id));
