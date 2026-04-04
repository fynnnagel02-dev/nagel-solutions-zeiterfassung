"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/src/lib/supabase/client";
import { Button } from "@/src/components/shared/Button";
import type { AppRole } from "@/src/lib/types/domain";

type TopbarProps = {
  companyName: string;
  role: AppRole;
  employeeName?: string;
};

const roleMap: Record<AppRole, { label: string; accent: string }> = {
  employee: {
    label: "Mitarbeitende",
    accent: "border-sky-200 bg-sky-50 text-sky-800",
  },
  team_lead: {
    label: "Teamleitung",
    accent: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  admin: {
    label: "Admin",
    accent: "border-slate-200 bg-slate-100 text-slate-800",
  },
};

export function Topbar({ companyName, role, employeeName }: TopbarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-[color:var(--color-border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] px-6 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
          {companyName}
        </p>
        <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
          {employeeName ? `Angemeldet als ${employeeName}` : "Angemeldeter Arbeitsbereich"}
        </p>
      </div>

      <div className="flex justify-end">
        <div className="flex flex-wrap items-center gap-2 rounded-[1.75rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)]/78 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <span
            className={`inline-flex h-11 items-center rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.16em] ${roleMap[role].accent}`}
          >
            {roleMap[role].label}
          </span>
          {employeeName ? (
            <span className="inline-flex h-11 items-center rounded-full border border-[color:var(--color-border-soft)] bg-white px-5 text-sm font-medium text-[color:var(--color-text)] shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
              {employeeName}
            </span>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="h-11 rounded-full px-5 py-0 shadow-none"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const client = createClient();
                await client.auth.signOut();
                router.push("/anmelden");
                router.refresh();
              })
            }
          >
            {isPending ? "Wird abgemeldet..." : "Abmelden"}
          </Button>
        </div>
      </div>
    </div>
  );
}
