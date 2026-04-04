"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { withdrawTimeEntryChangeRequest, createTimeEntryChangeRequest } from "@/app/actions/approvals";
import { Button } from "@/src/components/shared/Button";
import { FormMessage } from "@/src/components/shared/FormMessage";
import { toGermanErrorMessage } from "@/src/lib/forms/errors";

export function CorrectionRequestForm({
  timeEntryId,
}: {
  timeEntryId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [breakMinutes, setBreakMinutes] = useState("");
  const [comment, setComment] = useState("");

  return (
    <div className="space-y-3">
      <Button type="button" variant="secondary" onClick={() => setOpen((value) => !value)}>
        {open ? "Korrektur schließen" : "Korrektur anfragen"}
      </Button>
      {open ? (
        <div className="space-y-4 rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="datetime-local"
              value={startedAt}
              onChange={(event) => setStartedAt(event.target.value)}
              className="rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
            />
            <input
              type="datetime-local"
              value={endedAt}
              onChange={(event) => setEndedAt(event.target.value)}
              className="rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
            />
          </div>
          <input
            type="number"
            min={0}
            value={breakMinutes}
            onChange={(event) => setBreakMinutes(event.target.value)}
            placeholder="Pause in Minuten"
            className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
          />
          <textarea
            rows={3}
            placeholder="Begründung"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
          />
          <textarea
            rows={2}
            placeholder="Optionaler Kommentar"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
          />
          <Button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                setMessage(null);
                try {
                  await createTimeEntryChangeRequest({
                    timeEntryId,
                    reason,
                    proposedStartedAt: startedAt ? new Date(startedAt).toISOString() : null,
                    proposedEndedAt: endedAt ? new Date(endedAt).toISOString() : null,
                    proposedBreakMinutes: breakMinutes ? Number(breakMinutes) : null,
                    proposedComment: comment || null,
                  });
                  setOpen(false);
                  router.refresh();
                } catch (error) {
                  setMessage(toGermanErrorMessage(error));
                }
              })
            }
          >
            {isPending ? "Wird gesendet..." : "Korrektur absenden"}
          </Button>
          <FormMessage message={message} />
        </div>
      ) : null}
    </div>
  );
}

export function WithdrawCorrectionButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await withdrawTimeEntryChangeRequest(requestId);
          router.refresh();
        })
      }
    >
      {isPending ? "Wird zurückgezogen..." : "Zurückziehen"}
    </Button>
  );
}
