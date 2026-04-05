"use server";

import { isDemoModeActive } from "@/src/lib/demo/action-guard";
import { simulateExportAction } from "@/src/lib/demo/simulations";
import * as mutation from "@/src/lib/db/mutations/exports";

function normalizeInputWithType(input: unknown, exportType: string) {
  const record = typeof input === "object" && input ? (input as Record<string, unknown>) : {};
  return { ...record, exportType };
}

export async function exportMonthlyTimesheet(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateExportAction(normalizeInputWithType(input, "monthly_timesheet"));
  }
  return mutation.exportMonthlyTimesheet(input);
}

export async function exportAbsenceReport(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateExportAction(normalizeInputWithType(input, "absence_report"));
  }
  return mutation.exportAbsenceReport(input);
}

export async function exportTeamOverview(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateExportAction(normalizeInputWithType(input, "team_overview"));
  }
  return mutation.exportTeamOverview(input);
}
