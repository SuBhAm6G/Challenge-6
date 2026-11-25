import { z } from 'zod';
import { TransportModeSchema, type TransportMode } from '../household/types.ts';
import { ConfidenceLevelSchema, type ConfidenceLevel } from '../routine/types.ts';

export const EmissionFactorSchema = z.object({
  id: z.string().min(1),
  mode: TransportModeSchema,
  label: z.string().min(1),
  source: z.string().min(1),
  sourceUrl: z.string().url(),
  region: z.string().min(1),
  publicationYear: z.number().int().min(2000).max(2030),
  vehicleCategory: z.string().min(1),
  fuelOrEnergy: z.string().min(1),
  co2eGramsPerPassengerKm: z.number().nonnegative(),
  pm25MgPerPassengerKm: z.number().nonnegative().nullable(),
  noxMgPerPassengerKm: z.number().nonnegative().nullable(),
  occupancyAssumption: z.string().min(1),
  methodology: z.string().min(1),
  limitations: z.string().min(1),
});
export type EmissionFactor = z.infer<typeof EmissionFactorSchema>;

export const ImpactTypeSchema = z.enum([
  'exposure_management',
  'transport_emissions',
  'household_emissions',
  'community_action',
]);
export type ImpactType = z.infer<typeof ImpactTypeSchema>;

export interface ImpactCalculation {
  id: string;
  impactType: ImpactType;
  originalMode: TransportMode;
  alternativeMode: TransportMode;
  distanceKm: number;
  tripsPerWeek: number;
  calculable: boolean;
  co2eAvoidedKgPerWeek: number | null;
  pm25AvoidedGramsPerWeek: number | null;
  noxAvoidedGramsPerWeek: number | null;
  tripsAvoidedPerWeek: number;
  assumptions: string[];
  limitations: string[];
  confidence: ConfidenceLevel;
  factorIds: string[];
  qualitativeFallback?: string;
}

export interface ImpactExplanation {
  change: string;
  whyItMatters: string;
  estimatedEnvironmentalImpact: string;
  personalExposureConsideration: string;
  confidenceSummary: string;
  howWeCalculated: string[];
  limitations: string[];
}

export const CompletedImpactEntrySchema = z.object({
  id: z.string().min(1),
  dateIso: z.string().datetime(),
  impactType: ImpactTypeSchema,
  title: z.string().min(1),
  exposureNote: z.string().min(1),
  co2eAvoidedKg: z.number().nonnegative().nullable(),
  vehicleTripsAvoided: z.number().int().nonnegative(),
  confidence: ConfidenceLevelSchema,
});
export type CompletedImpactEntry = z.infer<typeof CompletedImpactEntrySchema>;
