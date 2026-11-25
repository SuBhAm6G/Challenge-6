import { z } from 'zod';

export const PollutantIdSchema = z.enum(['pm25', 'pm10', 'no2', 'so2', 'co', 'o3']);
export type PollutantId = z.infer<typeof PollutantIdSchema>;

export const ConcentrationUnitSchema = z.enum(['µg/m³', 'mg/m³']);
export type ConcentrationUnit = z.infer<typeof ConcentrationUnitSchema>;

export const AveragingPeriodSchema = z.enum(['1h', '8h', '24h', 'instant']);
export type AveragingPeriod = z.infer<typeof AveragingPeriodSchema>;

export const AQIStandardSchema = z.enum(['INDIA_NAQI', 'EUROPEAN_EAQI', 'US_EPA', 'UNKNOWN']);
export type AQIStandard = z.infer<typeof AQIStandardSchema>;

export const IndiaAQICategorySchema = z.enum([
  'Good',
  'Satisfactory',
  'Moderate',
  'Poor',
  'Very Poor',
  'Severe',
]);
export type IndiaAQICategory = z.infer<typeof IndiaAQICategorySchema>;

export const SourceTypeSchema = z.enum([
  'observation',
  'model_forecast',
  'user_sensor',
  'sample_data',
]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

export const FreshnessStatusSchema = z.enum([
  'recent',
  'delayed',
  'last_known',
  'stale',
  'forecast',
  'unavailable',
]);
export type FreshnessStatus = z.infer<typeof FreshnessStatusSchema>;

export const PollutantReadingSchema = z.object({
  pollutant: PollutantIdSchema,
  concentration: z.number().finite().nonnegative(),
  unit: ConcentrationUnitSchema,
  averagingPeriod: AveragingPeriodSchema,
});
export type PollutantReading = z.infer<typeof PollutantReadingSchema>;

export const AirQualityReadingSchema = z.object({
  id: z.string().min(1),
  locationName: z.string().min(1),
  city: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  sourceId: z.string().min(1),
  sourceName: z.string().min(1),
  sourceType: SourceTypeSchema,
  stationId: z.string().optional(),
  spatialResolutionNote: z.string().min(1),
  observationTime: z.string().datetime(),
  retrievalTime: z.string().datetime(),
  pollutants: z.array(PollutantReadingSchema),
  reportedAqi: z.number().finite().nonnegative().optional(),
  reportedAqiStandard: AQIStandardSchema.optional(),
  forecastVsObserved: z.enum(['observed', 'forecast', 'sample']),
  qualityFlags: z.array(z.string()),
});
export type AirQualityReading = z.infer<typeof AirQualityReadingSchema>;

export const HourlyForecastPointSchema = z.object({
  timestamp: z.string().datetime(),
  pollutants: z.array(PollutantReadingSchema),
  estimatedIndiaNaqi: z.number().int().nonnegative().nullable(),
  estimatedCategory: IndiaAQICategorySchema.nullable(),
  dominantPollutant: PollutantIdSchema.nullable(),
});
export type HourlyForecastPoint = z.infer<typeof HourlyForecastPointSchema>;

export const AirQualityForecastSchema = z.object({
  locationName: z.string().min(1),
  city: z.string().min(1),
  sourceId: z.string().min(1),
  sourceName: z.string().min(1),
  sourceType: SourceTypeSchema,
  spatialResolutionNote: z.string().min(1),
  retrievalTime: z.string().datetime(),
  hourly: z.array(HourlyForecastPointSchema),
});
export type AirQualityForecast = z.infer<typeof AirQualityForecastSchema>;

export interface PollutantSubIndex {
  pollutant: PollutantId;
  concentration: number;
  unit: ConcentrationUnit;
  subIndex: number;
  category: IndiaAQICategory;
  averagingPeriodWarning?: string;
}

export interface AQIResult {
  value: number | null;
  category: IndiaAQICategory | null;
  standard: AQIStandard;
  dominantPollutant: PollutantId | null;
  subIndices: PollutantSubIndex[];
  coverageCount: number;
  minimumCoverageMet: boolean;
  limitations: string[];
}
