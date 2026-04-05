import "server-only";

import { getCurrentSessionContext } from "@/src/lib/auth/session-context";
import { DEMO_IDS } from "@/src/lib/demo/session";
import { isAdmin, isTeamLead } from "@/src/lib/security/roles";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
} from "@/src/lib/security/errors";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";
import type { AppRole, SessionContext } from "@/src/lib/types/domain";

export async function assertAuthenticated() {
  return getCurrentSessionContext();
}

export async function assertProfileAccessEnabled() {
  const context = await getCurrentSessionContext();

  if (!context.profile.isActive) {
    throw new AuthenticationError("This account is deactivated");
  }

  return context;
}

export async function assertEmployeeIsActive() {
  const context = await assertProfileAccessEnabled();

  if (!context.employee?.isActive) {
    throw new ConflictError("This employee is not operationally active");
  }

  return context;
}

export async function assertRole(allowedRoles: AppRole[]) {
  const context = await assertProfileAccessEnabled();

  if (!allowedRoles.includes(context.profile.role)) {
    throw new AuthorizationError();
  }

  return context;
}

export async function assertAdmin() {
  return assertRole(["admin"]);
}

export async function assertTeamLeadOrAdmin() {
  const context = await assertProfileAccessEnabled();

  if (!isTeamLead(context.profile.role)) {
    throw new AuthorizationError();
  }

  if (context.runtime.mode === "demo") {
    if (context.profile.role === "team_lead" && !context.employee?.teamId) {
      throw new AuthorizationError("This demo account has no team scope assigned");
    }

    return context;
  }

  if (context.profile.role === "team_lead") {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("teams")
      .select("id")
      .eq("team_lead_employee_id", context.employee?.id ?? "")
      .maybeSingle();

    if (error || !data) {
      throw new AuthorizationError("This account is not assigned as a team lead");
    }
  }

  return context;
}

export async function assertCanAccessEmployee(targetEmployeeId: string) {
  const context = await assertProfileAccessEnabled();

  if (!context.employee && !isAdmin(context.profile.role)) {
    throw new AuthorizationError();
  }

  if (isAdmin(context.profile.role) || context.employee?.id === targetEmployeeId) {
    return context;
  }

  if (context.runtime.mode === "demo") {
    const demoScopedEmployeeIds = new Set([
      DEMO_IDS.employees.teamLead,
      DEMO_IDS.employees.employee,
      DEMO_IDS.employees.fieldOne,
      DEMO_IDS.employees.fieldTwo,
    ]);

    if (context.profile.role === "team_lead" && demoScopedEmployeeIds.has(targetEmployeeId)) {
      return context;
    }

    throw new AuthorizationError();
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("employees")
    .select("id, team_id")
    .eq("id", targetEmployeeId)
    .maybeSingle();

  if (error || !data) {
    throw new AuthorizationError();
  }

  const { data: team, error: teamError } = await admin
    .from("teams")
    .select("team_lead_employee_id")
    .eq("id", data.team_id ?? "")
    .maybeSingle();

  if (teamError || team?.team_lead_employee_id !== context.employee?.id) {
    throw new AuthorizationError();
  }

  return context;
}

export async function assertTeamLeadScopeForEmployee(targetEmployeeId: string) {
  const context = await assertTeamLeadOrAdmin();

  // Admins have global approval scope; team leads remain limited to their own team members.
  if (context.profile.role === "admin") {
    return context;
  }

  return assertCanAccessEmployee(targetEmployeeId);
}

export function assertHasEmployee(context: SessionContext) {
  if (!context.employee) {
    throw new AuthorizationError("No employee record is linked to this account");
  }

  return context.employee;
}
