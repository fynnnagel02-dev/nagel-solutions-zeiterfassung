import { cn } from "@/src/lib/presentation/cn";
import type { StatusTone } from "@/src/lib/presentation/status";

type StatusChipProps = {
  label: string;
  tone: StatusTone;
  className?: string;
};

const toneClasses: Record<StatusTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
};

export function StatusChip({ label, tone, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.02em]",
        toneClasses[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
