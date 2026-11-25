import { z } from 'zod';

export const AiContextPackageSchema = z.object({
  city: z.string().min(1).max(80),
  aqiStandard: z.string().min(1).max(30),
  aqiValue: z.number().nullable(),
  aqiCategory: z.string().nullable(),
  dominantPollutant: z.string().nullable(),
  pollutantSummary: z.string().max(400),
  dataSourceLabel: z.string().max(120),
  isForecastOrSample: z.enum(['observed', 'forecast', 'sample', 'unavailable']),
  observationTimeIso: z.string().nullable(),
  bestOutdoorWindowLabel: z.string().max(120).nullable(),
  householdSummary: z.object({
    memberCount: z.number().int().min(1).max(20),
    commuteMode: z.string().max(40),
    commuteDistanceKm: z.number().min(0).max(200),
    workPattern: z.string().max(40),
    hasSchoolChildren: z.boolean(),
    hasPriorityProtectionMembers: z.boolean(),
    exerciseHabit: z.string().max(40),
    budget: z.string().max(30),
  }),
  indoorSummary: z.object({
    hasPurifier: z.boolean(),
    cookingFuel: z.string().max(40),
    hasKitchenExhaust: z.boolean(),
    hasIndoorBurningSources: z.boolean(),
  }),
  deterministicHighlights: z.array(z.string().max(180)).max(6),
});
export type AiContextPackage = z.infer<typeof AiContextPackageSchema>;

export const AiChatRequestSchema = z.object({
  question: z.string().trim().min(2).max(800),
  context: AiContextPackageSchema,
});
export type AiChatRequest = z.infer<typeof AiChatRequestSchema>;

export const AiStructuredRecommendationSchema = z.object({
  id: z.string().min(1).max(80),
  action: z.string().min(1).max(400),
  timing: z.string().min(1).max(160),
  reason: z.string().min(1).max(600),
  exposureConsideration: z.string().min(1).max(600),
  environmentalConsideration: z.string().min(1).max(600),
  effort: z.enum(['no_cost', 'low_effort', 'moderate_effort']),
  confidence: z.enum(['high', 'moderate', 'limited']),
  evidenceIds: z.array(z.string().max(60)).max(6),
  caveats: z.array(z.string().max(400)).max(5),
  alternative: z.string().max(400).optional(),
  safetyNote: z.string().max(400).optional(),
});
export type AiStructuredRecommendation = z.infer<typeof AiStructuredRecommendationSchema>;

export const AiChatResponseSchema = z.object({
  summary: z.string().min(1).max(2000),
  recommendations: z.array(AiStructuredRecommendationSchema).max(6),
  followUpQuestion: z.string().max(400).optional(),
  dataLimitations: z.array(z.string().max(400)).max(6),
  sourceIdsUsed: z.array(z.string().max(60)).max(8),
  disclaimer: z.string().min(1).max(500),
});
export type AiChatResponse = z.infer<typeof AiChatResponseSchema>;
