"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getNavigationForRole } from "@/src/components/app/navigation";
import { cn } from "@/src/lib/presentation/cn";
import type { AppRole } from "@/src/lib/types/domain";

type SidebarNavProps = {
  role: AppRole;
};

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const navigation = getNavigationForRole(role);

  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[252px] shrink-0 overflow-hidden rounded-[2rem] border border-[color:var(--color-border-soft)] bg-[linear-gradient(180deg,#142544_0%,#162746_62%,#12213a_100%)] shadow-[0_18px_44px_rgba(15,23,42,0.12)] lg:flex">
      <div className="flex min-h-0 flex-1 flex-col px-4 py-6">
        <div className="space-y-1 px-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-text-muted)]">
            Nagel Solutions
          </p>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
            Zeiterfassung
          </h2>
        </div>

        <nav className="mt-8 flex-1 space-y-6 overflow-y-auto pr-1">
          <div className="space-y-2">
            {navigation.primary.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.matchPrefix ?? item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-white text-slate-900 shadow-[0_8px_18px_rgba(255,255,255,0.12)]"
                      : "text-slate-300 hover:bg-white/8 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {navigation.sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <p className="px-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {section.title}
              </p>
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.matchPrefix ?? item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition",
                      active
                        ? "bg-white text-slate-900 shadow-[0_8px_18px_rgba(255,255,255,0.12)]"
                        : "text-slate-300 hover:bg-white/8 hover:text-white"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
