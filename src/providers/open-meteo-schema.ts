import { z } from 'zod';
import { POLLUTANT_CATALOG } from '../data/pollutants.ts';
import type { PollutantId, PollutantReading } from '../domain/air-quality/types.ts';

const NullableNumberArray = z.array(z.number().nullable()).optional();

export const OpenMeteoResponseSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  current: z
    .object({
      time: z.string(),
      pm10: z.number().nullable().optional(),
      pm2_5: z.number().nullable().optional(),
      carbon_monoxide: z.number().nullable().optional(),
      nitrogen_dioxide: z.number().nullable().optional(),
      sulphur_dioxide: z.number().nullable().optional(),
      ozone: z.number().nullable().optional(),
      european_aqi: z.number().nullable().optional(),
    })
    .optional(),
  hourly: z
    .object({
      time: z.array(z.string()),
      pm10: NullableNumberArray,
      pm2_5: NullableNumberArray,
      carbon_monoxide: NullableNumberArray,
      nitrogen_dioxide: NullableNumberArray,
      sulphur_dioxide: NullableNumberArray,
      ozone: NullableNumberArray,
    })
    .optional(),
});

export function toIsoTimestamp(raw: string): string {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

export function extractPollutants(values: {
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  coUgM3?: number | null;
  o3?: number | null;
}): PollutantReading[] {
  const result: PollutantReading[] = [];
  const pushIfValid = (pollutant: PollutantId, raw: number | null | undefined, scale = 1) => {
    if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
      result.push({
        pollutant,
        concentration: Math.round((raw / scale) * 100) / 100,
        unit: POLLUTANT_CATALOG[pollutant]?.unit ?? (pollutant === 'co' ? 'mg/m³' : 'µg/m³'),
        averagingPeriod: '1h',
      });
    }
  };

  pushIfValid('pm25', values.pm25);
  pushIfValid('pm10', values.pm10);
  pushIfValid('no2', values.no2);
  pushIfValid('so2', values.so2);
  // Open-Meteo returns CO in µg/m³; India NAQI expects mg/m³.
  pushIfValid('co', values.coUgM3, 1000);
  pushIfValid('o3', values.o3);
  return result;
}
