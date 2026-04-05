import { z } from "zod";

import { isoDateSchema, optionalCommentSchema, uuidSchema } from "@/src/lib/validations/common";

export const createLeaveRequestSchema = z.object({
  employeeId: uuidSchema.optional(),
  leaveType: z.enum(["vacation", "sick", "medical", "other"]),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  durationMode: z.enum(["full_day", "partial_day"]).default("full_day"),
  partialStartTime: z.string().trim().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  partialEndTime: z.string().trim().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  comment: optionalCommentSchema,
}).superRefine((payload, context) => {
  if (payload.leaveType === "vacation" && payload.durationMode === "partial_day") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Urlaub kann nur ganztägig beantragt werden.",
      path: ["durationMode"],
    });
  }

  if (payload.durationMode === "partial_day") {
    if (payload.startDate !== payload.endDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Halbtägige Abwesenheiten müssen an einem einzelnen Tag liegen.",
        path: ["endDate"],
      });
    }

    if (!payload.partialStartTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bitte eine Startzeit angeben.",
        path: ["partialStartTime"],
      });
    }

    if (!payload.partialEndTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bitte eine Endzeit angeben.",
        path: ["partialEndTime"],
      });
    }

    if (
      payload.partialStartTime &&
      payload.partialEndTime &&
      payload.partialStartTime >= payload.partialEndTime
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Die Endzeit muss nach der Startzeit liegen.",
        path: ["partialEndTime"],
      });
    }
  }
});

export const cancelLeaveRequestSchema = z.object({
  leaveRequestId: uuidSchema,
});

export const decideLeaveRequestSchema = z.object({
  leaveRequestId: uuidSchema,
  reason: z.string().trim().max(1000).nullable().optional(),
});
