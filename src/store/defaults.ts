import { DEFAULT_DEMO_HOUSEHOLD, DEFAULT_DEMO_LOCATION } from '../data/cities.ts';
import { DEFAULT_COMMUNITY_PLAN } from '../data/community-templates.ts';
import type { AQIResult } from '../domain/air-quality/types.ts';
import type { AlertPreferences } from '../domain/alerts/types.ts';
import type { LocationPreset } from '../domain/household/types.ts';
import type { IndoorProfile } from '../domain/indoor/types.ts';

export const DEFAULT_INDOOR_PROFILE: IndoorProfile = {
  hasAirPurifier: false,
  purifierCadrKnown: false,
  primaryRooms: ['Bedroom', 'Living room'],
  hasKitchenExhaustOrChimney: true,
  cookingFuel: 'lpg_gas',
  burningSources: ['incense_agarbatti'],
  hasExternalVentilation: true,
  hasIndoorPm25Sensor: false,
  canOpenWindowsSafely: true,
  budget: 'low',
  updatedAt: '2026-11-25T08:00:00.000Z',
};

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  enabled: true,
  browserNotificationsGranted: false,
  notifyOnCategoryAtOrAbove: 'Poor',
  notifyOnForecastShift: true,
};

export const EMPTY_AQI_RESULT: AQIResult = {
  value: null,
  category: null,
  standard: 'INDIA_NAQI',
  dominantPollutant: null,
  subIndices: [],
  coverageCount: 0,
  minimumCoverageMet: false,
  limitations: ['No air quality data loaded yet.'],
};

export function locationCacheKey(loc: LocationPreset): string {
  return `${loc.city.toLowerCase()}::${loc.latitude.toFixed(2)}::${loc.longitude.toFixed(2)}`;
}

export { DEFAULT_COMMUNITY_PLAN, DEFAULT_DEMO_HOUSEHOLD, DEFAULT_DEMO_LOCATION };
