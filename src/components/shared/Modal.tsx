"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/src/lib/presentation/cn";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/50 p-4 md:p-6">
      <div className="flex min-h-full items-center justify-center">
        <button
          type="button"
          aria-label="Modal schließen"
          className="fixed inset-0 cursor-default"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={cn(
            "relative z-10 my-8 w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[color:var(--color-border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] shadow-[0_36px_96px_rgba(15,23,42,0.28)]",
            className
          )}
        >
          <div className="border-b border-[color:var(--color-border-soft)] px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[color:var(--color-text)]">
                  {title}
                </h2>
                {description ? (
                  <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-[color:var(--color-border-soft)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--color-text-soft)] shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
              >
                Schließen
              </button>
            </div>
          </div>
          <div className="max-h-[calc(100vh-11rem)] overflow-y-auto px-6 py-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
