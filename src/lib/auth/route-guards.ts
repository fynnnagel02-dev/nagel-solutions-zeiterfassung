import "server-only";

import { redirect } from "next/navigation";

import { getCurrentSessionContext } from "@/src/lib/auth/session-context";
import type { AppRole, SessionContext } from "@/src/lib/types/domain";

function redirectByState(context: SessionContext) {
  if (!context.profile.isActive || (context.employee && !context.employee.isActive)) {
    redirect("/konto-inaktiv");
  }
}

export async function requireAppSession() {
  try {
    const context = await getCurrentSessionContext();
    redirectByState(context);
    return context;
  } catch {
    redirect("/anmelden");
  }
}

export async function requireEmployeeSession() {
  const context = await requireAppSession();

  if (!context.employee || !context.employee.isActive) {
    redirect("/konto-inaktiv");
  }

  return context;
}

export async function requireRole(roles: AppRole[]) {
  const context = await requireEmployeeSession();

  if (!roles.includes(context.profile.role)) {
    redirect("/");
  }

  return context;
}

export async function requireTeamAccess() {
  const context = await requireEmployeeSession();

  if (context.profile.role !== "team_lead" && context.profile.role !== "admin") {
    redirect("/");
  }

  return context;
}

export async function requireAdminAccess() {
  return requireRole(["admin"]);
}
