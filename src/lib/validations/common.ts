import { z } from "zod";

const postgresUuidPattern =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function isPostgresUuidLike(value: unknown): value is string {
  return typeof value === "string" && postgresUuidPattern.test(value.trim());
}

export const uuidSchema = z
  .string()
  .trim()
  .min(1)
  .regex(postgresUuidPattern, "Invalid UUID");
export const isoDateSchema = z.iso.date();
export const isoDateTimeSchema = z.iso.datetime({ offset: true });
export const optionalCommentSchema = z.string().trim().max(1000).nullable().optional();
export const positiveMinutesSchema = z.number().int().min(0).max(24 * 60);

export function parseWithSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  return schema.parse(input);
}
