"use server";

import * as query from "@/src/lib/db/queries/dashboard";

export async function getCompanyContext() {
  return query.getCompanyContext();
}

export async function getCompanySettingsForAdmin() {
  return query.getCompanySettingsForAdmin();
}

export async function getMyTodayTimeEntry() {
  return query.getMyTodayTimeEntry();
}

export async function getMyWeekOverview() {
  return query.getMyWeekOverview();
}

export async function getMyLeaveOverview() {
  return query.getMyLeaveOverview();
}

export async function getTeamTodayOverview() {
  return query.getTeamTodayOverview();
}

export async function getPendingApprovalsForMyScope() {
  return query.getPendingApprovalsForMyScope();
}

export async function getMonthlyEmployeeSummary(employeeId: string, year: number, month: number) {
  return query.getMonthlyEmployeeSummary(employeeId, year, month);
}

export async function getAdminDashboardSummary() {
  return query.getAdminDashboardSummary();
}
