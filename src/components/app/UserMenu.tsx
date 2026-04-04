"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/src/lib/supabase/client";
import { Button } from "@/src/components/shared/Button";

type UserMenuProps = {
  employeeName?: string;
  showButtonLabel?: boolean;
};

export function UserMenu({ employeeName, showButtonLabel = true }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)]"
      >
        {showButtonLabel ? employeeName ?? "Benutzerkonto" : "Details"}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-72 rounded-[1.5rem] border border-[color:var(--color-border-strong)] bg-white p-4 shadow-[0_24px_56px_rgba(15,23,42,0.14)]">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
              Sitzung
            </p>
            <p className="text-sm text-[color:var(--color-text-soft)]">
              {employeeName ? `Angemeldet als ${employeeName}` : "Aktive Sitzung"}
            </p>
          </div>

          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
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
      ) : null}
    </div>
  );
}
