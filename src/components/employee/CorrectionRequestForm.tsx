"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { withdrawTimeEntryChangeRequest, createTimeEntryChangeRequest } from "@/app/actions/approvals";
import { Button } from "@/src/components/shared/Button";
import { FormMessage } from "@/src/components/shared/FormMessage";
import { getActionMessage, getActionSuccessTone, getActionTone, isDemoActionResult } from "@/src/lib/demo/client";
import { toGermanErrorMessage } from "@/src/lib/forms/errors";

export function CorrectionRequestForm({
  timeEntryId,
  projects,
  currentProjectId,
}: {
  timeEntryId: string;
  projects: Array<{ id: string; name: string }>;
  currentProjectId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [successTone, setSuccessTone] = useState<"success" | "warning">("success");
  const [reason, setReason] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [breakMinutes, setBreakMinutes] = useState("");
  const [projectId, setProjectId] = useState(currentProjectId ?? projects[0]?.id ?? "");
  const [comment, setComment] = useState("");

  return (
    <div className="space-y-3">
      <Button type="button" variant="secondary" onClick={() => setOpen((value) => !value)}>
        {open ? "Korrektur schließen" : "Korrektur anfragen"}
      </Button>
      {open ? (
        <div className="space-y-4 rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4">
          {projects.length === 0 ? (
            <FormMessage
              message="Zurzeit ist kein aktives Projekt verfügbar. Bitte legen Sie zuerst ein Projekt an oder aktivieren Sie 'Intern / Allgemein'."
            />
          ) : null}
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
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
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
            disabled={isPending || projects.length === 0}
            onClick={() =>
              startTransition(async () => {
                setMessage(null);
                setSuccess(null);
                try {
                  const result = await createTimeEntryChangeRequest({
                    timeEntryId,
                    reason,
                    proposedStartedAt: startedAt ? new Date(startedAt).toISOString() : null,
                    proposedEndedAt: endedAt ? new Date(endedAt).toISOString() : null,
                    proposedBreakMinutes: breakMinutes ? Number(breakMinutes) : null,
                    proposedProjectId: projectId,
                    proposedComment: comment || null,
                  });
                  setSuccess(getActionMessage(result, "Korrektur wurde eingereicht."));
                  setSuccessTone(getActionSuccessTone(result));
                  if (!isDemoActionResult(result)) {
                    setOpen(false);
                    router.refresh();
                  }
                } catch (error) {
                  setMessage(toGermanErrorMessage(error));
                }
              })
            }
          >
            {isPending ? "Wird gesendet..." : "Korrektur absenden"}
          </Button>
          <FormMessage message={message} />
          <FormMessage message={success} tone={successTone} />
        </div>
      ) : null}
    </div>
  );
}

export function WithdrawCorrectionButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"error" | "success" | "warning">("success");

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              const result = await withdrawTimeEntryChangeRequest(requestId);
              setTone(getActionTone(result, "success"));
              setMessage(getActionMessage(result, "Korrekturanfrage wurde zurückgezogen."));
              if (!isDemoActionResult(result)) {
                router.refresh();
              }
            } catch (error) {
              setTone("error");
              setMessage(toGermanErrorMessage(error));
            }
          })
        }
      >
        {isPending ? "Wird zurückgezogen..." : "Zurückziehen"}
      </Button>
      <FormMessage message={message} tone={tone} />
    </div>
  );
}
