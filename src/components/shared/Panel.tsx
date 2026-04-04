import type { ReactNode } from "react";

import { cn } from "@/src/lib/presentation/cn";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-[color:var(--color-border-strong)] bg-white/92 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm",
        className
      )}
    >
      {children}
    </section>
  );
}
