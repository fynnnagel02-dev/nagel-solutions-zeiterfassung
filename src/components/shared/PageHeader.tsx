import type { ReactNode } from "react";

import { cn } from "@/src/lib/presentation/cn";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 -mx-2 rounded-[2rem] border border-transparent bg-[color:var(--color-shell)]/88 px-2 pb-4 pt-1 backdrop-blur",
        className
      )}
    >
      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--color-border-soft)] bg-white/72 px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[color:var(--color-text)]">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-sm leading-6 text-[color:var(--color-text-soft)]">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
