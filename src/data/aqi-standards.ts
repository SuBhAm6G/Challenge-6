import type { IndiaAQICategory, PollutantId } from '../domain/air-quality/types.ts';

export interface AQIBreakpoint {
  category: IndiaAQICategory;
  iLow: number;
  iHigh: number;
  cLow: number;
  cHigh: number;
}

export interface IndiaCategoryMeta {
  category: IndiaAQICategory;
  rangeLabel: string;
  minAqi: number;
  maxAqi: number;
  /** Accessible high-contrast badge styling for warm light UI */
  badgeBgClass: string;
  badgeTextClass: string;
  borderClass: string;
  accentHex: string;
  cpcbGuidance: string;
}

export const INDIA_CATEGORY_META: readonly IndiaCategoryMeta[] = [
  {
    category: 'Good',
    rangeLabel: '0–50',
    minAqi: 0,
    maxAqi: 50,
    badgeBgClass: 'bg-emerald-100',
    badgeTextClass: 'text-emerald-900',
    borderClass: 'border-emerald-400',
    accentHex: '#0F6E56',
    cpcbGuidance:
      'Minimal impact. Suitable for normal outdoor routines; keep checking local conditions.',
  },
  {
    category: 'Satisfactory',
    rangeLabel: '51–100',
    minAqi: 51,
    maxAqi: 100,
    badgeBgClass: 'bg-lime-100',
    badgeTextClass: 'text-lime-900',
    borderClass: 'border-lime-500',
    accentHex: '#4D7C0F',
    cpcbGuidance: 'May cause minor breathing discomfort to sensitive people.',
  },
  {
    category: 'Moderate',
    rangeLabel: '101–200',
    minAqi: 101,
    maxAqi: 200,
    badgeBgClass: 'bg-amber-100',
    badgeTextClass: 'text-amber-950',
    borderClass: 'border-amber-500',
    accentHex: '#B45309',
    cpcbGuidance:
      'May cause breathing discomfort to people with lung or heart conditions, children, and older adults.',
  },
  {
    category: 'Poor',
    rangeLabel: '201–300',
    minAqi: 201,
    maxAqi: 300,
    badgeBgClass: 'bg-orange-100',
    badgeTextClass: 'text-orange-950',
    borderClass: 'border-orange-600',
    accentHex: '#C2410C',
    cpcbGuidance:
      'May cause breathing discomfort to most people on prolonged exposure; prefer shorter outdoor exertion.',
  },
  {
    category: 'Very Poor',
    rangeLabel: '301–400',
    minAqi: 301,
    maxAqi: 400,
    badgeBgClass: 'bg-red-100',
    badgeTextClass: 'text-red-950',
    borderClass: 'border-red-600',
    accentHex: '#B91C1C',
    cpcbGuidance:
      'May cause respiratory illness on prolonged exposure. Effect may be more pronounced in sensitive groups.',
  },
  {
    category: 'Severe',
    rangeLabel: '401–500+',
    minAqi: 401,
    maxAqi: 999,
    badgeBgClass: 'bg-rose-950',
    badgeTextClass: 'text-rose-50',
    borderClass: 'border-rose-900',
    accentHex: '#881337',
    cpcbGuidance:
      'May affect healthy people and seriously impact those with existing respiratory or heart conditions. Shift vigorous activity indoors.',
  },
] as const;

export const INDIA_CATEGORY_BY_NAME: ReadonlyMap<IndiaAQICategory, IndiaCategoryMeta> = new Map(
  INDIA_CATEGORY_META.map((item) => [item.category, item]),
);

/**
 * Official CPCB India National Air Quality Index (NAQI) breakpoints.
 * Units: PM2.5, PM10, NO2, SO2, O3 in µg/m³; CO in mg/m³.
 * Source: CPCB About_AQI.pdf (2014).
 */
export const INDIA_NAQI_BREAKPOINTS: Readonly<Record<PollutantId, readonly AQIBreakpoint[]>> = {
  pm25: [
    { category: 'Good', iLow: 0, iHigh: 50, cLow: 0, cHigh: 30 },
    { category: 'Satisfactory', iLow: 51, iHigh: 100, cLow: 30.0001, cHigh: 60 },
    { category: 'Moderate', iLow: 101, iHigh: 200, cLow: 60.0001, cHigh: 90 },
    { category: 'Poor', iLow: 201, iHigh: 300, cLow: 90.0001, cHigh: 120 },
    { category: 'Very Poor', iLow: 301, iHigh: 400, cLow: 120.0001, cHigh: 250 },
    { category: 'Severe', iLow: 401, iHigh: 500, cLow: 250.0001, cHigh: 500 },
  ],
  pm10: [
    { category: 'Good', iLow: 0, iHigh: 50, cLow: 0, cHigh: 50 },
    { category: 'Satisfactory', iLow: 51, iHigh: 100, cLow: 50.0001, cHigh: 100 },
    { category: 'Moderate', iLow: 101, iHigh: 200, cLow: 100.0001, cHigh: 250 },
    { category: 'Poor', iLow: 201, iHigh: 300, cLow: 250.0001, cHigh: 350 },
    { category: 'Very Poor', iLow: 301, iHigh: 400, cLow: 350.0001, cHigh: 430 },
    { category: 'Severe', iLow: 401, iHigh: 500, cLow: 430.0001, cHigh: 600 },
  ],
  no2: [
    { category: 'Good', iLow: 0, iHigh: 50, cLow: 0, cHigh: 40 },
    { category: 'Satisfactory', iLow: 51, iHigh: 100, cLow: 40.0001, cHigh: 80 },
    { category: 'Moderate', iLow: 101, iHigh: 200, cLow: 80.0001, cHigh: 180 },
    { category: 'Poor', iLow: 201, iHigh: 300, cLow: 180.0001, cHigh: 280 },
    { category: 'Very Poor', iLow: 301, iHigh: 400, cLow: 280.0001, cHigh: 400 },
    { category: 'Severe', iLow: 401, iHigh: 500, cLow: 400.0001, cHigh: 600 },
  ],
  so2: [
    { category: 'Good', iLow: 0, iHigh: 50, cLow: 0, cHigh: 40 },
    { category: 'Satisfactory', iLow: 51, iHigh: 100, cLow: 40.0001, cHigh: 80 },
    { category: 'Moderate', iLow: 101, iHigh: 200, cLow: 80.0001, cHigh: 380 },
    { category: 'Poor', iLow: 201, iHigh: 300, cLow: 380.0001, cHigh: 800 },
    { category: 'Very Poor', iLow: 301, iHigh: 400, cLow: 800.0001, cHigh: 1600 },
    { category: 'Severe', iLow: 401, iHigh: 500, cLow: 1600.0001, cHigh: 2000 },
  ],
  co: [
    { category: 'Good', iLow: 0, iHigh: 50, cLow: 0, cHigh: 1.0 },
    { category: 'Satisfactory', iLow: 51, iHigh: 100, cLow: 1.0001, cHigh: 2.0 },
    { category: 'Moderate', iLow: 101, iHigh: 200, cLow: 2.0001, cHigh: 10.0 },
    { category: 'Poor', iLow: 201, iHigh: 300, cLow: 10.0001, cHigh: 17.0 },
    { category: 'Very Poor', iLow: 301, iHigh: 400, cLow: 17.0001, cHigh: 34.0 },
    { category: 'Severe', iLow: 401, iHigh: 500, cLow: 34.0001, cHigh: 50.0 },
  ],
  o3: [
    { category: 'Good', iLow: 0, iHigh: 50, cLow: 0, cHigh: 50 },
    { category: 'Satisfactory', iLow: 51, iHigh: 100, cLow: 50.0001, cHigh: 100 },
    { category: 'Moderate', iLow: 101, iHigh: 200, cLow: 100.0001, cHigh: 168 },
    { category: 'Poor', iLow: 201, iHigh: 300, cLow: 168.0001, cHigh: 208 },
    { category: 'Very Poor', iLow: 301, iHigh: 400, cLow: 208.0001, cHigh: 748 },
    { category: 'Severe', iLow: 401, iHigh: 500, cLow: 748.0001, cHigh: 1000 },
  ],
};

export const REQUIRED_AVERAGING_PERIODS: Readonly<Record<PollutantId, string>> = {
  pm25: '24h',
  pm10: '24h',
  no2: '24h',
  so2: '24h',
  co: '8h',
  o3: '8h',
};
