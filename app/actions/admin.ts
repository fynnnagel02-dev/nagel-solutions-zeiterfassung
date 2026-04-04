"use server";

import * as mutation from "@/src/lib/db/mutations/admin";

export async function createEmployee(input: unknown) {
  return mutation.createEmployee(input);
}

export async function updateEmployee(input: unknown) {
  return mutation.updateEmployee(input);
}

export async function deactivateEmployee(employeeId: string, reason?: string) {
  return mutation.deactivateEmployee(employeeId, reason);
}

export async function createTeam(input: unknown) {
  return mutation.createTeam(input);
}

export async function updateTeam(input: unknown) {
  return mutation.updateTeam(input);
}

export async function archiveTeam(input: unknown) {
  return mutation.archiveTeam(input);
}

export async function assignTeamLead(input: unknown) {
  return mutation.assignTeamLead(input);
}

export async function createWorkSchedule(input: unknown) {
  return mutation.createWorkSchedule(input);
}

export async function updateWorkSchedule(input: unknown) {
  return mutation.updateWorkSchedule(input);
}

export async function updateCompanySettings(input: unknown) {
  return mutation.updateCompanySettings(input);
}

export async function createProject(input: unknown) {
  return mutation.createProject(input);
}

export async function updateProject(input: unknown) {
  return mutation.updateProject(input);
}

export async function archiveProject(input: unknown) {
  return mutation.archiveProject(input);
}

export async function createHoliday(input: unknown) {
  return mutation.createHoliday(input);
}

export async function updateHoliday(input: unknown) {
  return mutation.updateHoliday(input);
}

export async function deleteHoliday(input: unknown) {
  return mutation.deleteHoliday(input);
}
