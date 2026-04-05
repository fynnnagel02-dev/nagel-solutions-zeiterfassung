import { z } from "zod";

import { isoDateSchema, uuidSchema } from "@/src/lib/validations/common";

export const exportRequestSchema = z.object({
  exportType: z.enum(["monthly_timesheet", "absence_report", "team_overview", "project_time_report"]),
  dateFrom: isoDateSchema,
  dateTo: isoDateSchema,
  employeeId: uuidSchema.nullable().optional(),
  teamId: uuidSchema.nullable().optional(),
  projectId: uuidSchema.nullable().optional(),
});
