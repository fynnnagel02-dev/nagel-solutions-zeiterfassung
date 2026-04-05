import type { ReactNode } from "react";

import { AppShell } from "@/src/components/app/AppShell";
import { getAppShellData } from "@/src/lib/app-shell-data";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { context, company, employeeName } = await getAppShellData();

  return (
    <AppShell
      role={context.profile.role}
      companyName={company.companyName}
      employeeName={employeeName}
      isDemo={context.runtime.mode === "demo"}
      embed={context.runtime.embed}
      basePath={context.runtime.basePath}
      showRoleSwitcher={context.runtime.mode === "demo" && !context.runtime.embed}
    >
      {children}
    </AppShell>
  );
}
