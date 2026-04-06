"use client";

import { startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getDefaultPathForRole } from "@/src/lib/demo/paths";
import { cn } from "@/src/lib/presentation/cn";
import type { AppRole } from "@/src/lib/types/domain";

const roleOptions: Array<{ role: AppRole; label: string }> = [
  { role: "admin", label: "Admin" },
  { role: "team_lead", label: "Teamleiter" },
  { role: "employee", label: "Mitarbeiter" },
];

export function DemoRoleSwitcher({ role }: { role: AppRole }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateRole(nextRole: AppRole) {
    const params = new URLSearchParams();
    params.set("role", nextRole);

    const embed = searchParams.get("embed");
    if (embed === "true" || embed === "1") {
      params.set("embed", "true");
    }

    document.cookie = `ns_demo_role=${nextRole}; Path=/demo; SameSite=Lax`;
    const targetPath = `/demo${getDefaultPathForRole(nextRole)}`;

    startTransition(() => {
      router.replace(`${targetPath}?${params.toString()}`);
    });
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-amber-200 bg-amber-50 p-2">
      {roleOptions.map((option) => (
        <button
          key={option.role}
          type="button"
          onClick={() => updateRole(option.role)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            option.role === role
              ? "bg-amber-500 text-white shadow-[0_10px_24px_rgba(217,119,6,0.25)]"
              : "text-amber-900 hover:bg-amber-100"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
