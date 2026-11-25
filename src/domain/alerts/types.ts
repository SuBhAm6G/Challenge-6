import { z } from 'zod';
import { IndiaAQICategorySchema } from '../air-quality/types.ts';

export const AlertTypeSchema = z.enum([
  'aqi_category_worsened',
  'outdoor_window_shifted',
  'forecast_spike_ahead',
  'indoor_maintenance_due',
  'routine_review_needed',
]);
export type AlertType = z.infer<typeof AlertTypeSchema>;

export interface CleanAirAlert {
  id: string;
  dedupKey: string;
  type: AlertType;
  severity: 'info' | 'caution' | 'high';
  title: string;
  message: string;
  nextStep: string;
  isForecastBased: boolean;
  dataTimestamp: string;
  sourceName: string;
  createdAt: string;
}

export const AlertPreferencesSchema = z.object({
  enabled: z.boolean(),
  browserNotificationsGranted: z.boolean(),
  notifyOnCategoryAtOrAbove: IndiaAQICategorySchema,
  notifyOnForecastShift: z.boolean(),
  lastFilterReminderIso: z.string().datetime().optional(),
});
export type AlertPreferences = z.infer<typeof AlertPreferencesSchema>;
