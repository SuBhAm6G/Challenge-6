import { z } from 'zod';

export const LocationLabelSchema = z.enum(['home', 'work', 'school', 'community', 'custom']);
export type LocationLabel = z.infer<typeof LocationLabelSchema>;

export const LocationPrecisionSchema = z.enum(['city', 'locality', 'precise']);
export type LocationPrecision = z.infer<typeof LocationPrecisionSchema>;

export const LocationPresetSchema = z.object({
  id: z.string().min(1),
  label: LocationLabelSchema,
  customName: z.string().max(60).optional(),
  city: z.string().min(1).max(80),
  locality: z.string().max(100).default(''),
  state: z.string().max(80).default('India'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  precision: LocationPrecisionSchema,
});
export type LocationPreset = z.infer<typeof LocationPresetSchema>;

export const TransportModeSchema = z.enum([
  'car_petrol',
  'car_diesel',
  'car_cng',
  'car_ev',
  'carpool',
  'motorcycle',
  'auto_cng',
  'bus',
  'metro',
  'bicycle',
  'walking',
  'remote',
]);
export type TransportMode = z.infer<typeof TransportModeSchema>;

export const VulnerabilityFlagSchema = z.enum([
  'children',
  'older_adults',
  'pregnant',
  'respiratory_or_heart',
]);
export type VulnerabilityFlag = z.infer<typeof VulnerabilityFlagSchema>;

export const ActivityTypeSchema = z.enum([
  'outdoor_vigorous',
  'outdoor_light',
  'commute',
  'indoor',
  'errands',
]);
export type ActivityType = z.infer<typeof ActivityTypeSchema>;

export const SchedulePeriodSchema = z.enum([
  'morning',
  'commute_am',
  'work_school',
  'afternoon',
  'exercise',
  'errands',
  'evening',
]);
export type SchedulePeriod = z.infer<typeof SchedulePeriodSchema>;

export const ScheduleSlotSchema = z.object({
  id: z.string().min(1),
  period: SchedulePeriodSchema,
  label: z.string().min(1).max(60),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(1).max(24),
  activityType: ActivityTypeSchema,
  enabled: z.boolean(),
});
export type ScheduleSlot = z.infer<typeof ScheduleSlotSchema>;

export const BudgetLevelSchema = z.enum(['zero_cost', 'low', 'moderate', 'flexible']);
export type BudgetLevel = z.infer<typeof BudgetLevelSchema>;

export const WorkPatternSchema = z.enum(['office', 'hybrid', 'remote', 'outdoor_work', 'shift']);
export const ExerciseHabitSchema = z.enum([
  'none',
  'morning_walk_run',
  'evening_walk_run',
  'flexible',
]);

export const HouseholdProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
  memberCount: z.number().int().min(1).max(20),
  primaryCommuteMode: TransportModeSchema,
  commuteDistanceKmOneWay: z.number().min(0).max(200),
  workPattern: WorkPatternSchema,
  hasSchoolGoingChildren: z.boolean(),
  outdoorExerciseHabit: ExerciseHabitSchema,
  protectionFlags: z.array(VulnerabilityFlagSchema),
  budget: BudgetLevelSchema,
  preferredLanguage: z.enum(['en', 'hi']),
  schedule: z.array(ScheduleSlotSchema),
  isDemo: z.boolean().default(false),
  updatedAt: z.string().datetime(),
});
export type HouseholdProfile = z.infer<typeof HouseholdProfileSchema>;
