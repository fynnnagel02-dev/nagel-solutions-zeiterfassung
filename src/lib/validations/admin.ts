import { z } from "zod";

import { isoDateSchema, positiveMinutesSchema, uuidSchema } from "@/src/lib/validations/common";

export const dailyMinutesSchema = positiveMinutesSchema.max(24 * 60);
export const weeklyMinutesSchema = positiveMinutesSchema.max(7 * 24 * 60);

export const employeeFieldsSchema = z.object({
  authUserId: uuidSchema.optional(),
  email: z.email().trim().optional(),
  role: z.enum(["employee", "team_lead", "admin"]),
  employeeNumber: z.string().trim().min(1).max(50).optional(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  teamId: uuidSchema.nullable().optional(),
  workScheduleId: uuidSchema.nullable().optional(),
  employmentStartDate: isoDateSchema,
  employmentEndDate: isoDateSchema.nullable().optional(),
  targetDailyMinutesOverride: dailyMinutesSchema.nullable().optional(),
  targetWeeklyMinutesOverride: weeklyMinutesSchema.nullable().optional(),
});

export const createEmployeeSchema = employeeFieldsSchema.refine((value) => Boolean(value.authUserId || value.email), {
  message: "Either authUserId or email is required",
  path: ["authUserId"],
});

export const updateEmployeeSchema = employeeFieldsSchema.partial().extend({
  employeeId: uuidSchema,
});

export const createTeamSchema = z.object({
  name: z.string().trim().min(1).max(100),
  teamLeadEmployeeId: uuidSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateTeamSchema = createTeamSchema.partial().extend({
  teamId: uuidSchema,
  memberIds: z.array(uuidSchema).optional(),
});

export const archiveTeamSchema = z.object({
  teamId: uuidSchema,
  isActive: z.boolean().optional(),
});

export const assignTeamLeadSchema = z.object({
  teamId: uuidSchema,
  teamLeadEmployeeId: uuidSchema.nullable(),
});

export const workScheduleDaySchema = z.object({
  weekday: z.number().int().min(1).max(7),
  isWorkday: z.boolean(),
  targetMinutes: dailyMinutesSchema,
});

export const createWorkScheduleSchema = z.object({
  name: z.string().trim().min(1).max(100),
  weeklyTargetMinutes: weeklyMinutesSchema,
  days: z.array(workScheduleDaySchema).length(7),
  isActive: z.boolean().optional(),
});

export const updateWorkScheduleSchema = createWorkScheduleSchema.partial().extend({
  workScheduleId: uuidSchema,
});

export const updateCompanySettingsSchema = z.object({
  companyName: z.string().trim().min(1).max(160).optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
  holidayRegionCode: z.string().trim().min(1).max(20).optional(),
  defaultDailyTargetMinutes: dailyMinutesSchema.optional(),
  defaultWeeklyTargetMinutes: weeklyMinutesSchema.optional(),
  defaultAnnualLeaveDays: z.number().min(0).max(366).optional(),
  carryOverEnabled: z.boolean().optional(),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().min(1).max(40).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  projectId: uuidSchema,
  isActive: z.boolean().optional(),
});

export const archiveProjectSchema = z.object({
  projectId: uuidSchema,
  isActive: z.boolean().optional(),
});

export const createHolidaySchema = z.object({
  holidayDate: isoDateSchema,
  regionCodes: z.array(z.string().trim().min(1).max(20)).min(1).max(16),
  name: z.string().trim().min(1).max(120),
  isCompanyObserved: z.boolean().optional(),
});

export const updateHolidaySchema = createHolidaySchema.extend({
  holidayIds: z.array(uuidSchema).min(1),
});

export const deleteHolidaySchema = z.object({
  holidayIds: z.array(uuidSchema).min(1),
});
