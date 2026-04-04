import type { ReactNode } from "react";

import { Panel } from "@/src/components/shared/Panel";

type MetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: ReactNode;
};

export function MetricCard({ label, value, hint, accent }: MetricCardProps) {
  return (
    <Panel className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[color:var(--color-text-muted)]">{label}</p>
          <p className="text-3xl font-semibold tracking-[-0.05em] text-[color:var(--color-text)]">
            {value}
          </p>
        </div>
        {accent}
      </div>
      {hint ? <p className="text-sm text-[color:var(--color-text-soft)]">{hint}</p> : null}
    </Panel>
  );
}
