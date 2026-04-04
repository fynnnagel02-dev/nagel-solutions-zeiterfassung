import type { ReactNode } from "react";

import { MobileNav } from "@/src/components/app/MobileNav";
import { SidebarNav } from "@/src/components/app/SidebarNav";
import { Topbar } from "@/src/components/app/Topbar";
import type { AppRole } from "@/src/lib/types/domain";

type AppShellProps = {
  children: ReactNode;
  role: AppRole;
  companyName: string;
  employeeName?: string;
};

export function AppShell({ children, role, companyName, employeeName }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[color:var(--color-shell)] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex max-w-[1600px] items-start gap-6">
        <SidebarNav role={role} />
        <div className="min-w-0 flex-1 space-y-6 pb-28 lg:pb-6">
          <Topbar companyName={companyName} role={role} employeeName={employeeName} />
          <main className="space-y-6">{children}</main>
        </div>
      </div>
      <MobileNav role={role} />
    </div>
  );
}
