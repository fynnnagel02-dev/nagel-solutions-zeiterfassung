import { z } from "zod";

import { isoDateSchema, optionalCommentSchema, uuidSchema } from "@/src/lib/validations/common";

export const createLeaveRequestSchema = z.object({
  employeeId: uuidSchema.optional(),
  leaveType: z.enum(["vacation", "sick", "other"]),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  startDayPart: z.enum(["full", "morning", "afternoon"]).default("full"),
  endDayPart: z.enum(["full", "morning", "afternoon"]).default("full"),
  comment: optionalCommentSchema,
});

export const cancelLeaveRequestSchema = z.object({
  leaveRequestId: uuidSchema,
});

export const decideLeaveRequestSchema = z.object({
  leaveRequestId: uuidSchema,
  reason: z.string().trim().max(1000).nullable().optional(),
});
