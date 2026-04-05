import type { ReactNode } from "react";

import { AppRuntimeProvider } from "@/src/components/app/AppRuntimeProvider";
import { MobileNav } from "@/src/components/app/MobileNav";
import { SidebarNav } from "@/src/components/app/SidebarNav";
import { Topbar } from "@/src/components/app/Topbar";
import type { AppRole } from "@/src/lib/types/domain";

type AppShellProps = {
  children: ReactNode;
  role: AppRole;
  companyName: string;
  employeeName?: string;
  isDemo?: boolean;
  embed?: boolean;
  basePath?: string;
  showRoleSwitcher?: boolean;
};

export function AppShell({
  children,
  role,
  companyName,
  employeeName,
  isDemo = false,
  embed = false,
  basePath = "",
  showRoleSwitcher = false,
}: AppShellProps) {
  return (
    <AppRuntimeProvider value={{ isDemo, role, embed, basePath, showRoleSwitcher }}>
      <div className="min-h-screen bg-[color:var(--color-shell)] px-4 py-4 md:px-6 md:py-6">
        <div className="mx-auto flex max-w-[1600px] items-start gap-6">
          {!embed ? <SidebarNav role={role} /> : null}
          <div className="min-w-0 flex-1 space-y-6 pb-28 lg:pb-6">
            <Topbar
              companyName={companyName}
              role={role}
              employeeName={employeeName}
              isDemo={isDemo}
              embed={embed}
              showRoleSwitcher={showRoleSwitcher}
            />
            <main className="space-y-6">{children}</main>
          </div>
        </div>
        {!embed ? <MobileNav role={role} /> : null}
      </div>
    </AppRuntimeProvider>
  );
}
