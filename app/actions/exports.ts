"use server";

import * as mutation from "@/src/lib/db/mutations/exports";

export async function exportMonthlyTimesheet(input: unknown) {
  return mutation.exportMonthlyTimesheet(input);
}

export async function exportAbsenceReport(input: unknown) {
  return mutation.exportAbsenceReport(input);
}

export async function exportTeamOverview(input: unknown) {
  return mutation.exportTeamOverview(input);
}
