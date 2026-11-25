import { z } from 'zod';

export const CommunityRoleSchema = z.enum([
  'rwa_coordinator',
  'school_coordinator',
  'resident_volunteer',
  'society_committee',
]);
export type CommunityRole = z.infer<typeof CommunityRoleSchema>;

export const CommunityActionStatusSchema = z.enum(['planned', 'in_progress', 'completed']);
export type CommunityActionStatus = z.infer<typeof CommunityActionStatusSchema>;

export const CommunityActionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  responsibleRole: z.string().min(1).max(80),
  suggestedDeadline: z.string().min(1).max(60),
  status: CommunityActionStatusSchema,
  effort: z.enum(['low', 'moderate', 'coordinated']),
  explanation: z.string().min(1).max(500),
  evidenceId: z.string().optional(),
});
export type CommunityAction = z.infer<typeof CommunityActionSchema>;

export const CommunityPlanSchema = z.object({
  id: z.string().min(1),
  communityName: z.string().min(1).max(100),
  city: z.string().min(1).max(80),
  organizerRole: CommunityRoleSchema,
  actions: z.array(CommunityActionSchema),
  updatedAt: z.string().datetime(),
});
export type CommunityPlan = z.infer<typeof CommunityPlanSchema>;
