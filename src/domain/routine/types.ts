import { z } from 'zod';
import { SchedulePeriodSchema } from '../household/types.ts';

export const RecommendationStatusSchema = z.enum(['pending', 'accepted', 'dismissed', 'completed']);
export type RecommendationStatus = z.infer<typeof RecommendationStatusSchema>;

export const ConfidenceLevelSchema = z.enum(['high', 'moderate', 'limited']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const EffortLevelSchema = z.enum(['no_cost', 'low_effort', 'moderate_effort', 'planned']);
export type EffortLevel = z.infer<typeof EffortLevelSchema>;

export const RoutineRecommendationSchema = z.object({
  id: z.string().min(1),
  period: SchedulePeriodSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  suggestedTiming: z.string().min(1),
  relevantContext: z.string().min(1),
  reason: z.string().min(1),
  exposureEffect: z.string().min(1),
  environmentalImpact: z.string().min(1),
  effort: EffortLevelSchema,
  confidence: ConfidenceLevelSchema,
  evidenceIds: z.array(z.string()),
  caveats: z.array(z.string()),
  alternative: z
    .object({
      title: z.string().min(1),
      description: z.string().min(1),
      tradeOff: z.string().min(1),
    })
    .optional(),
  origin: z.enum(['deterministic', 'ai_assisted']),
  status: RecommendationStatusSchema,
});
export type RoutineRecommendation = z.infer<typeof RoutineRecommendationSchema>;

export interface OutdoorWindow {
  startHour: number;
  endHour: number;
  startIso: string;
  endIso: string;
  averageEstimatedAqi: number;
  category: string;
  confidenceNote: string;
}
