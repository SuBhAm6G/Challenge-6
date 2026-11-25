import { z } from 'zod';
import { BudgetLevelSchema } from '../household/types.ts';
import type { ConfidenceLevel } from '../routine/types.ts';
export { BudgetLevelSchema };

export const CookingFuelSchema = z.enum([
  'lpg_gas',
  'piped_gas',
  'electric_induction',
  'biomass',
  'mixed',
]);
export type CookingFuel = z.infer<typeof CookingFuelSchema>;

export const IndoorBurningSourceSchema = z.enum([
  'incense_agarbatti',
  'mosquito_coils',
  'candles_diyas',
  'tobacco_vaping',
]);
export type IndoorBurningSource = z.infer<typeof IndoorBurningSourceSchema>;

export const IndoorProfileSchema = z.object({
  hasAirPurifier: z.boolean(),
  purifierCadrKnown: z.boolean().default(false),
  purifierCadrM3h: z.number().min(0).max(1500).optional(),
  primaryRooms: z.array(z.string()).default(['Living room', 'Bedroom']),
  hasKitchenExhaustOrChimney: z.boolean(),
  cookingFuel: CookingFuelSchema,
  burningSources: z.array(IndoorBurningSourceSchema),
  hasExternalVentilation: z.boolean(),
  hasIndoorPm25Sensor: z.boolean(),
  canOpenWindowsSafely: z.boolean(),
  budget: z.enum(['zero_cost', 'low', 'moderate', 'flexible']),
  updatedAt: z.string().datetime(),
});
export type IndoorProfile = z.infer<typeof IndoorProfileSchema>;

export const IndoorActionCategorySchema = z.enum([
  'source_control',
  'ventilation',
  'filtration',
  'cleaner_room',
  'maintenance',
]);
export type IndoorActionCategory = z.infer<typeof IndoorActionCategorySchema>;

export interface IndoorAction {
  id: string;
  category: IndoorActionCategory;
  title: string;
  whatToDo: string;
  whyItHelps: string;
  whenRelevant: string;
  costEffort: string;
  evidenceIds: string[];
  limitations: string;
  safetyNote: string;
  confidence: ConfidenceLevel;
  priority: 'high' | 'medium' | 'standard';
}

export interface VentilationGuidance {
  status: 'close_and_minimize' | 'selective_window' | 'ventilate_now' | 'uncertain';
  headline: string;
  explanation: string;
  combustionSafetyWarning: string;
  recommendedWindowText?: string;
}
