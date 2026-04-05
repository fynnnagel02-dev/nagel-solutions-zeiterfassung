"use server";

import { isDemoModeActive } from "@/src/lib/demo/action-guard";
import { simulateAdminAction } from "@/src/lib/demo/simulations";
import * as mutation from "@/src/lib/db/mutations/admin";

export async function createEmployee(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("employee_created", input);
  }
  return mutation.createEmployee(input);
}

export async function updateEmployee(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("employee_updated", input);
  }
  return mutation.updateEmployee(input);
}

export async function deactivateEmployee(employeeId: string, reason?: string) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("employee_deactivated", { employeeId, reason });
  }
  return mutation.deactivateEmployee(employeeId, reason);
}

export async function createTeam(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("team_created", input);
  }
  return mutation.createTeam(input);
}

export async function updateTeam(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("team_updated", input);
  }
  return mutation.updateTeam(input);
}

export async function archiveTeam(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("team_archived", input);
  }
  return mutation.archiveTeam(input);
}

export async function assignTeamLead(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("team_lead_assigned", input);
  }
  return mutation.assignTeamLead(input);
}

export async function createWorkSchedule(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("work_schedule_created", input);
  }
  return mutation.createWorkSchedule(input);
}

export async function updateWorkSchedule(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("work_schedule_updated", input);
  }
  return mutation.updateWorkSchedule(input);
}

export async function updateCompanySettings(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("company_settings_updated", input);
  }
  return mutation.updateCompanySettings(input);
}

export async function createProject(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("project_created", input);
  }
  return mutation.createProject(input);
}

export async function updateProject(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("project_updated", input);
  }
  return mutation.updateProject(input);
}

export async function archiveProject(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("project_archived", input);
  }
  return mutation.archiveProject(input);
}

export async function createHoliday(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("holiday_created", input);
  }
  return mutation.createHoliday(input);
}

export async function updateHoliday(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("holiday_updated", input);
  }
  return mutation.updateHoliday(input);
}

export async function deleteHoliday(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateAdminAction("holiday_deleted", input);
  }
  return mutation.deleteHoliday(input);
}
