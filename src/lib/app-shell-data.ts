import "server-only";

import { requireAppSession } from "@/src/lib/auth/route-guards";
import { getCompanyContext } from "@/src/lib/db/queries/dashboard";
import { getDemoEmployeeName, getDemoSessionContext } from "@/src/lib/demo/session";
import type { AppRuntimeState } from "@/src/lib/demo/runtime";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";

async function getEmployeeName(employeeId: string | null) {
  if (!employeeId) {
    return undefined;
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("employees")
    .select("first_name, last_name")
    .eq("id", employeeId)
    .maybeSingle();

  if (!data) {
    return undefined;
  }

  return `${data.first_name} ${data.last_name}`;
}

export async function getAppShellData(runtimeOverride?: AppRuntimeState) {
  const context =
    runtimeOverride?.isDemo
      ? await getDemoSessionContext(runtimeOverride.role, runtimeOverride)
      : await requireAppSession();
  const company = await getCompanyContext();
  const employeeName = runtimeOverride?.isDemo
    ? getDemoEmployeeName(runtimeOverride.role)
    : await getEmployeeName(context.employee?.id ?? null);

  return {
    context,
    company,
    employeeName,
  };
}
