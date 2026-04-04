import "server-only";

import { assertAdmin, assertEmployeeIsActive, assertHasEmployee } from "@/src/lib/auth/assertions";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";
import { exportRequestSchema } from "@/src/lib/validations/exports";

async function createExportLog(input: unknown) {
  const context = await assertEmployeeIsActive();
  if (context.profile.role !== "admin") {
    await assertAdmin();
  }
  const employee = assertHasEmployee(context);
  const payload = exportRequestSchema.parse(input);
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("export_logs")
    .insert({
      export_type: payload.exportType,
      requested_by_employee_id: employee.id,
      scope_description: {
        employeeId: payload.employeeId ?? null,
        teamId: payload.teamId ?? null,
      },
      filters: {
        dateFrom: payload.dateFrom,
        dateTo: payload.dateTo,
      },
      status: "completed",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const exportMonthlyTimesheet = createExportLog;
export const exportAbsenceReport = createExportLog;
export const exportTeamOverview = createExportLog;
