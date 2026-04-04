import type { ReactNode } from "react";

import { Panel } from "@/src/components/shared/Panel";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Panel className="border-dashed border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)]">
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-[color:var(--color-text)]">{title}</h3>
        <p className="max-w-2xl text-sm leading-6 text-[color:var(--color-text-soft)]">
          {description}
        </p>
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </Panel>
  );
}
