import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/src/lib/presentation/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--color-sidebar)] text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] hover:-translate-y-px",
  secondary:
    "border border-[color:var(--color-border-strong)] bg-white text-[color:var(--color-text)] hover:bg-[color:var(--color-panel-soft)]",
  ghost: "bg-transparent text-[color:var(--color-text-soft)] hover:bg-white",
  danger: "bg-rose-600 text-white shadow-[0_12px_24px_rgba(225,29,72,0.18)] hover:-translate-y-px",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
