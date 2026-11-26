/**
 * Canonical evidence source identifiers permitted across deterministic engines and AI citations.
 */
export const VALID_EVIDENCE_IDS = [
  'cpcb-naqi',
  'open-meteo-aq',
  'who-aqg-2021',
  'epa-air-cleaners',
  'epa-cleaner-room',
  'epa-ozone-caution',
  'india-ghg-transport',
] as const;

export type EvidenceSourceId = (typeof VALID_EVIDENCE_IDS)[number];
