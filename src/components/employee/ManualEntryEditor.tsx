"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveManualTimeEntry, updateEditableTimeEntry } from "@/app/actions/time";
import { Button } from "@/src/components/shared/Button";
import { FormMessage } from "@/src/components/shared/FormMessage";
import { Panel } from "@/src/components/shared/Panel";
import { toGermanErrorMessage } from "@/src/lib/forms/errors";

type Entry = {
  id?: string;
  entryDate: string;
  startedAt: string | null;
  endedAt: string | null;
  projectId: string | null;
  comment: string | null;
  breakMinutes: number;
  editable: boolean;
};

type ProjectOption = {
  id: string;
  name: string;
};

function toLocalDateTimeValue(isoValue: string | null) {
  if (!isoValue) {
    return "";
  }

  const date = new Date(isoValue);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ManualEntryEditor({
  entry,
  projects,
}: {
  entry: Entry;
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [startedAt, setStartedAt] = useState(toLocalDateTimeValue(entry.startedAt));
  const [endedAt, setEndedAt] = useState(toLocalDateTimeValue(entry.endedAt));
  const [breakMinutes, setBreakMinutes] = useState(String(entry.breakMinutes));
  const [comment, setComment] = useState(entry.comment ?? "");
  const [projectId, setProjectId] = useState(entry.projectId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const actionLabel = useMemo(() => {
    if (!entry.id) {
      return "Eintrag ergänzen";
    }
    return entry.editable ? "Eintrag bearbeiten" : "Nicht editierbar";
  }, [entry.editable, entry.id]);

  if (entry.id && !entry.editable) {
    return (
      <Button type="button" variant="ghost" disabled>
        Nicht editierbar
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant={entry.id ? "secondary" : "ghost"} onClick={() => setOpen((value) => !value)}>
        {open ? "Bearbeitung schließen" : actionLabel}
      </Button>

      {open ? (
        <Panel className="space-y-4 border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-text)]">Beginn</label>
              <input
                type="datetime-local"
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-text)]">Ende</label>
              <input
                type="datetime-local"
                value={endedAt}
                onChange={(event) => setEndedAt(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[180px_1fr]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-text)]">Pause in Min.</label>
              <input
                type="number"
                min={0}
                value={breakMinutes}
                onChange={(event) => setBreakMinutes(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-text)]">Projekt</label>
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
              >
                <option value="">Ohne Projekt</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--color-text)]">Kommentar</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={isPending}
              onClick={() => {
                setMessage(null);
                setSuccess(null);

                startTransition(async () => {
                  try {
                    const payload = {
                      entryDate: entry.entryDate,
                      startedAt: new Date(startedAt).toISOString(),
                      endedAt: new Date(endedAt).toISOString(),
                      breakMinutes: Number(breakMinutes || 0),
                      projectId: projectId || null,
                      comment: comment || null,
                    };

                    if (entry.id) {
                      await updateEditableTimeEntry({
                        timeEntryId: entry.id,
                        ...payload,
                      });
                    } else {
                      await saveManualTimeEntry(payload);
                    }

                    setSuccess("Eintrag gespeichert.");
                    setOpen(false);
                    router.refresh();
                  } catch (error) {
                    setMessage(toGermanErrorMessage(error));
                  }
                });
              }}
            >
              {isPending ? "Speichert..." : "Speichern"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
          </div>

          <FormMessage message={message} />
          <FormMessage message={success} tone="success" />
        </Panel>
      ) : null}
    </div>
  );
}
