"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/src/components/shared/Button";
import { Modal } from "@/src/components/shared/Modal";

type DialogLauncherProps = {
  buttonLabel: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function DialogLauncher({
  buttonLabel,
  title,
  description,
  children,
}: DialogLauncherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        {buttonLabel}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} description={description}>
        {children}
      </Modal>
    </>
  );
}
