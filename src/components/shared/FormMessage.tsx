import { cn } from "@/src/lib/presentation/cn";

type FormMessageProps = {
  message?: string | null;
  tone?: "error" | "success" | "muted";
};

const toneMap = {
  error: "border-rose-200 bg-rose-50 text-rose-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  muted: "border-slate-200 bg-slate-50 text-slate-600",
};

export function FormMessage({ message, tone = "error" }: FormMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-sm", toneMap[tone])}>
      {message}
    </div>
  );
}
