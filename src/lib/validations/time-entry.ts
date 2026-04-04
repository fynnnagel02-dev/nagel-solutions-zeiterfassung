import { z } from "zod";

import {
  isoDateSchema,
  isoDateTimeSchema,
  optionalCommentSchema,
  positiveMinutesSchema,
  uuidSchema,
} from "@/src/lib/validations/common";

export const liveWorkdaySchema = z.object({
  employeeId: uuidSchema.optional(),
  entryDate: isoDateSchema,
  startedAt: isoDateTimeSchema,
});

export const startBreakSchema = z.object({
  timeEntryId: uuidSchema,
  startedAt: isoDateTimeSchema,
});

export const endBreakSchema = z.object({
  timeEntryId: uuidSchema,
  endedAt: isoDateTimeSchema,
});

export const endWorkdaySchema = z.object({
  timeEntryId: uuidSchema,
  endedAt: isoDateTimeSchema,
});

export const manualTimeEntrySchema = z.object({
  employeeId: uuidSchema.optional(),
  entryDate: isoDateSchema,
  startedAt: isoDateTimeSchema,
  endedAt: isoDateTimeSchema,
  breakMinutes: positiveMinutesSchema.default(0),
  projectId: uuidSchema.nullable().optional(),
  comment: optionalCommentSchema,
});

export const updateEditableTimeEntrySchema = manualTimeEntrySchema.partial().extend({
  timeEntryId: uuidSchema,
});

export const submitTimeEntrySchema = z.object({
  timeEntryId: uuidSchema,
});

export const reopenTimeEntrySchema = z.object({
  timeEntryId: uuidSchema,
  reason: z.string().trim().min(1).max(1000),
});

export const timeEntryChangeRequestSchema = z.object({
  timeEntryId: uuidSchema,
  reason: z.string().trim().min(1).max(1000),
  proposedStartedAt: isoDateTimeSchema.nullable().optional(),
  proposedEndedAt: isoDateTimeSchema.nullable().optional(),
  proposedBreakMinutes: positiveMinutesSchema.nullable().optional(),
  proposedProjectId: uuidSchema.nullable().optional(),
  proposedComment: optionalCommentSchema,
});

export const decideTimeEntryChangeRequestSchema = z.object({
  changeRequestId: uuidSchema,
  reason: z.string().trim().max(1000).nullable().optional(),
});
