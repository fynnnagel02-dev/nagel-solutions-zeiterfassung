"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  approveLeaveRequest,
  approveTimeEntry,
  approveTimeEntryChangeRequest,
  rejectLeaveRequest,
  rejectTimeEntry,
  rejectTimeEntryChangeRequest,
} from "@/app/actions/approvals";
import { Button } from "@/src/components/shared/Button";
import { FormMessage } from "@/src/components/shared/FormMessage";
import { toGermanErrorMessage } from "@/src/lib/forms/errors";

type ApprovalKind = "time" | "leave" | "correction";

export function ApprovalDecisionControls({
  kind,
  id,
}: {
  kind: ApprovalKind;
  id: string | null;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function decide(decision: "approve" | "reject") {
    setMessage(null);
    if (!id || !id.trim()) {
      setMessage("Die Anfrage konnte nicht verarbeitet werden, weil keine gültige Kennung übergeben wurde.");
      return;
    }
    try {
      if (kind === "time") {
        if (decision === "approve") {
          await approveTimeEntry(id, reason || undefined);
        } else {
          await rejectTimeEntry(id, reason || undefined);
        }
      }

      if (kind === "leave") {
        if (decision === "approve") {
          await approveLeaveRequest({ leaveRequestId: id, reason: reason || null });
        } else {
          await rejectLeaveRequest({ leaveRequestId: id, reason: reason || null });
        }
      }

      if (kind === "correction") {
        if (decision === "approve") {
          await approveTimeEntryChangeRequest({ changeRequestId: id, reason: reason || null });
        } else {
          await rejectTimeEntryChangeRequest({ changeRequestId: id, reason: reason || null });
        }
      }

      router.refresh();
    } catch (error) {
      setMessage(toGermanErrorMessage(error));
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Begründung für die Entscheidung"
        className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
      />
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => decide("approve"))}
        >
          {isPending ? "Bitte warten..." : "Freigeben"}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={isPending}
          onClick={() => startTransition(async () => decide("reject"))}
        >
          {isPending ? "Bitte warten..." : "Ablehnen"}
        </Button>
      </div>
      <FormMessage message={message} />
    </div>
  );
}
