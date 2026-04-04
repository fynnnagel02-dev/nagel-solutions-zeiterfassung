"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getNavigationForRole } from "@/src/components/app/navigation";
import { cn } from "@/src/lib/presentation/cn";
import type { AppRole } from "@/src/lib/types/domain";

type MobileNavProps = {
  role: AppRole;
};

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const items = getNavigationForRole(role).primary.slice(0, 4);

  return (
    <nav className="fixed inset-x-0 bottom-4 z-30 mx-auto flex max-w-md gap-2 rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[color:var(--color-sidebar)]/96 p-2 shadow-[0_18px_44px_rgba(15,23,42,0.24)] backdrop-blur lg:hidden">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.matchPrefix ?? item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 rounded-[1.25rem] px-3 py-3 text-center text-xs font-semibold transition",
              active ? "bg-white text-slate-900" : "text-slate-300"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
