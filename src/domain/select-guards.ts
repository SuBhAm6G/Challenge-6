import type { z } from 'zod';

/**
 * Safely parses a `<select>` string value against a Zod enum schema without `as` casts.
 */
export function parseEnumValue<T extends string>(
  schema: z.ZodType<T>,
  raw: string,
  fallback: T,
): T {
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : fallback;
}
