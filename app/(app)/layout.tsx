import type { ReactNode } from "react";

import { AppShell } from "@/src/components/app/AppShell";
import { requireAppSession } from "@/src/lib/auth/route-guards";
import { getCompanyContext } from "@/src/lib/db/queries/dashboard";
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

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [context, company] = await Promise.all([requireAppSession(), getCompanyContext()]);
  const employeeName = await getEmployeeName(context.employee?.id ?? null);

  return (
    <AppShell
      role={context.profile.role}
      companyName={company.companyName}
      employeeName={employeeName}
    >
      {children}
    </AppShell>
  );
}
