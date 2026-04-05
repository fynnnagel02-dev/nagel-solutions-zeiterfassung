import "server-only";

import { redirect } from "next/navigation";

import { buildAppHref } from "@/src/lib/demo/paths";
import { getAppRuntimeState } from "@/src/lib/demo/runtime";
import { getCurrentSessionContext } from "@/src/lib/auth/session-context";
import type { AppRole, SessionContext } from "@/src/lib/types/domain";

async function appHref(path: string, context?: SessionContext) {
  if (context?.runtime.mode === "demo") {
    return buildAppHref(path, {
      isDemo: true,
      role: context.runtime.role,
      embed: context.runtime.embed,
      basePath: context.runtime.basePath,
    });
  }

  const runtime = await getAppRuntimeState();
  return buildAppHref(path, {
    isDemo: runtime.isDemo,
    role: runtime.role,
    embed: runtime.embed,
    basePath: runtime.basePath,
  });
}

async function redirectByState(context: SessionContext) {
  if (!context.profile.isActive || (context.employee && !context.employee.isActive)) {
    redirect(await appHref("/konto-inaktiv", context));
  }
}

export async function requireAppSession() {
  try {
    const context = await getCurrentSessionContext();
    await redirectByState(context);
    return context;
  } catch {
    const runtime = await getAppRuntimeState();
    if (runtime.isDemo) {
      redirect(buildAppHref("/", runtime));
    }
    redirect("/anmelden");
  }
}

export async function requireEmployeeSession() {
  const context = await requireAppSession();

  if (!context.employee || !context.employee.isActive) {
    redirect(await appHref("/konto-inaktiv", context));
  }

  return context;
}

export async function requireRole(roles: AppRole[]) {
  const context = await requireEmployeeSession();

  if (!roles.includes(context.profile.role)) {
    redirect(await appHref("/", context));
  }

  return context;
}

export async function requireTeamAccess() {
  const context = await requireEmployeeSession();

  if (context.profile.role !== "team_lead" && context.profile.role !== "admin") {
    redirect(await appHref("/", context));
  }

  return context;
}

export async function requireAdminAccess() {
  return requireRole(["admin"]);
}
