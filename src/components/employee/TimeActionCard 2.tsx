"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { endBreak, endWorkday, startBreak, startWorkday, submitTimeEntryForApproval } from "@/app/actions/time";
import { useAppHref } from "@/src/components/app/AppRuntimeProvider";
import { Button } from "@/src/components/shared/Button";
import { FormMessage } from "@/src/components/shared/FormMessage";
import { Panel } from "@/src/components/shared/Panel";
import { StatusChip } from "@/src/components/shared/StatusChip";
import { getActionMessage, isDemoActionResult } from "@/src/lib/demo/client";
import { formatClock, formatMinutes } from "@/src/lib/presentation/format";
import { getTimeEntryStatusPresentation } from "@/src/lib/presentation/status";
import { toGermanErrorMessage } from "@/src/lib/forms/errors";

type TodayEntry = {
  id: string;
  started_at: string | null;
  ended_at: string | null;
  approval_status: "not_submitted" | "pending" | "approved" | "rejected";
  status: "open" | "complete" | "in_review" | "approved" | "rejected" | "corrected";
  computedWorkedMinutes: number;
  computedBreakMinutes: number;
  targetMinutes: number;
  project_id: string | null;
  projects?: { name?: string | null; code?: string | null } | null;
  time_entry_breaks?: Array<{ ended_at: string | null; started_at: string; source?: string | null }>;
};

type ProjectOption = {
  id: string;
  name: string;
};

function getOpenBreak(entry: TodayEntry | null) {
  return entry?.time_entry_breaks?.find((item) => !item.ended_at) ?? null;
}

function getLiveMinutes(entry: TodayEntry | null, nowMs: number) {
  if (!entry?.started_at || entry.ended_at) {
    return entry?.computedWorkedMinutes ?? 0;
  }

  const openBreak = getOpenBreak(entry);
  if (openBreak) {
    return entry.computedWorkedMinutes;
  }

  const startedAtMs = new Date(entry.started_at).getTime();
  return entry.computedWorkedMinutes + Math.max(0, Math.round((nowMs - startedAtMs) / 60_000));
}

function getTimelineItems(entry: TodayEntry | null) {
  if (!entry) {
    return [
      {
        label: "Noch keine Buchung",
        value: "Starten Sie Ihren Arbeitstag, sobald Sie einsatzbereit sind.",
      },
    ];
  }

  const items = [
    {
      label: "Beginn",
      value: formatClock(entry.started_at),
    },
  ];

  for (const currentBreak of entry.time_entry_breaks ?? []) {
    items.push({
      label:
        currentBreak.source === "auto_legal"
          ? "Gesetzliche Pause"
          : currentBreak.ended_at
            ? "Pause"
            : "Pause läuft",
      value: currentBreak.ended_at
        ? `${formatClock(currentBreak.started_at)} - ${formatClock(currentBreak.ended_at)}`
        : `seit ${formatClock(currentBreak.started_at)}`,
    });
  }

  items.push({
    label: "Ende",
    value: entry.ended_at ? formatClock(entry.ended_at) : "Noch offen",
  });

  return items;
}

export function TimeActionCard({
  entry,
  projects,
}: {
  entry: TodayEntry | null;
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const weekHref = useAppHref("/woche");
  const leaveHref = useAppHref("/abwesenheiten");
  const correctionsHref = useAppHref("/korrekturen");
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [projectId, setProjectId] = useState(() => entry?.project_id ?? projects[0]?.id ?? "");

  useEffect(() => {
    if (!entry?.started_at || entry.ended_at || getOpenBreak(entry)) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [entry]);

  useEffect(() => {
    if (entry?.project_id) {
      setProjectId(entry.project_id);
      return;
    }

    if (!entry && projects.length > 0) {
      setProjectId((current) => current || projects[0].id);
    }
  }, [entry, projects]);

  const openBreak = getOpenBreak(entry);
  const liveWorkedMinutes = useMemo(() => getLiveMinutes(entry, now), [entry, now]);
  const status = getTimeEntryStatusPresentation(entry?.status ?? "complete", entry?.approval_status, Boolean(openBreak));
  const delta = (entry?.targetMinutes ?? 0) - liveWorkedMinutes;
  const timelineItems = getTimelineItems(entry);
  const currentProjectLabel =
    entry?.projects?.name ?? projects.find((project) => project.id === projectId)?.name ?? null;
  const autoLegalBreakPresent = Boolean(entry?.time_entry_breaks?.some((item) => item.source === "auto_legal"));

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setMessage(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const result = await action();
        setSuccess(getActionMessage(result, successMessage));
        if (!isDemoActionResult(result)) {
          router.refresh();
        }
      } catch (error) {
        setMessage(toGermanErrorMessage(error));
      }
    });
  }

  return (
    <Panel className="overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[1.3fr_0.95fr]">
        <div className="space-y-6 bg-[linear-gradient(180deg,rgba(17,32,57,0.985),rgba(20,39,70,0.985))] px-6 py-7 text-white">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300/90">
                Tagesstatus
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em]">
                {entry?.started_at ? "Ihr Arbeitstag läuft" : "Bereit für den Arbeitstag"}
              </h2>
              <p className="max-w-xl text-sm leading-6 text-slate-200/90">
                {entry?.started_at
                  ? "Zeiten, Pausen und Freigabestatus greifen hier in einem klaren Ablauf zusammen."
                  : "Die Startfläche zeigt nur den nächsten operativen Schritt und den bestätigten Status für heute."}
              </p>
            </div>
            <StatusChip
              label={status.label}
              tone={status.tone}
              className="border-white/20 bg-white/10 text-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Arbeitszeit heute</p>
                  <p className="mt-2 text-4xl font-semibold tabular-nums">{formatMinutes(liveWorkedMinutes)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Soll / Delta</p>
                  <p className="mt-2 text-lg font-semibold tabular-nums">
                    {formatMinutes(entry?.targetMinutes ?? 0)}
                  </p>
                  <p className="mt-1 text-sm font-medium tabular-nums text-slate-300">
                    {delta > 0 ? "-" : "+"}
                    {formatMinutes(Math.abs(delta)).replace(" Std.", "")}
                  </p>
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,rgba(191,219,254,0.95),rgba(255,255,255,0.96))]"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(6, ((liveWorkedMinutes || 0) / Math.max(entry?.targetMinutes ?? 1, 1)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Pause gesamt</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums">
                  {formatMinutes(entry?.computedBreakMinutes ?? 0)}
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Freigabestatus</p>
                <p className="mt-2 text-lg font-semibold">
                  {entry?.approval_status === "pending"
                    ? "Zur Freigabe eingereicht"
                    : entry?.approval_status === "approved"
                      ? "Freigegeben"
                      : entry?.approval_status === "rejected"
                        ? "Abgelehnt"
                        : "Noch nicht eingereicht"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Tagesablauf</p>
                <p className="mt-1 text-sm text-slate-200/90">
                  Klarer Verlauf von Beginn, Pausen und Abschluss.
                </p>
              </div>
              {entry?.started_at ? (
                <p className="text-sm font-medium text-slate-200">
                  Beginn {formatClock(entry.started_at)}
                </p>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {timelineItems.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="rounded-[1.2rem] border border-white/10 bg-black/10 px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5 bg-white px-6 py-7">
          <div className="space-y-1 border-b border-[color:var(--color-border-soft)] pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
              Heute buchen
            </p>
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[color:var(--color-text)]">
              Nächster Schritt
            </h3>
            <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">
              Die Oberfläche zeigt nur Aktionen, die zum serverbestätigten Tagesstatus passen.
            </p>
          </div>

          {!entry ? (
            <div className="space-y-3">
              {projects.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[color:var(--color-text)]">Projekt für heute</label>
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
                  </div>
                  <Button
                    className="w-full py-4"
                    disabled={isPending || !projectId}
                    onClick={() =>
                      runAction(
                        () =>
                          startWorkday({
                            entryDate: new Date().toISOString().slice(0, 10),
                            startedAt: new Date().toISOString(),
                            projectId,
                          }),
                        "Arbeitstag gestartet."
                      )
                    }
                  >
                    {isPending ? "Wird gestartet..." : "Arbeitstag starten"}
                  </Button>
                </>
              ) : (
                <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4 text-sm leading-6 text-[color:var(--color-text-soft)]">
                  Es ist aktuell kein aktives Projekt zugeordnet. Bitte legen Sie zuerst ein Projekt an oder
                  nutzen Sie das Sammelprojekt <span className="font-medium text-[color:var(--color-text)]">Intern / Allgemein</span>.
                </div>
              )}
            </div>
          ) : null}

          {entry && !entry.ended_at && !openBreak ? (
            <Button
              className="w-full py-4"
              disabled={isPending}
              onClick={() =>
                runAction(
                  () => startBreak({ timeEntryId: entry.id, startedAt: new Date().toISOString() }),
                  "Pause gestartet."
                )
              }
            >
              {isPending ? "Bitte warten..." : "Pause starten"}
            </Button>
          ) : null}

          {entry && openBreak ? (
            <Button
              className="w-full py-4"
              disabled={isPending}
              onClick={() =>
                runAction(
                  () => endBreak({ timeEntryId: entry.id, endedAt: new Date().toISOString() }),
                  "Pause beendet."
                )
              }
            >
              {isPending ? "Bitte warten..." : "Pause beenden"}
            </Button>
          ) : null}

          {entry && entry.started_at && !entry.ended_at && !openBreak ? (
            <Button
              variant="secondary"
              className="w-full py-4"
              disabled={isPending}
              onClick={() =>
                runAction(
                  () => endWorkday({ timeEntryId: entry.id, endedAt: new Date().toISOString() }),
                  "Arbeitstag beendet."
                )
              }
            >
              {isPending ? "Bitte warten..." : "Arbeitstag beenden"}
            </Button>
          ) : null}

          {entry && entry.ended_at && entry.approval_status === "not_submitted" ? (
            <Button
              variant="secondary"
              className="w-full py-4"
              disabled={isPending}
              onClick={() =>
                runAction(
                  () => submitTimeEntryForApproval({ timeEntryId: entry.id }),
                  "Eintrag zur Freigabe eingereicht."
                )
              }
            >
              {isPending ? "Wird eingereicht..." : "Zur Freigabe einreichen"}
            </Button>
          ) : null}

          <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4 text-sm leading-6 text-[color:var(--color-text-soft)]">
            {currentProjectLabel ? (
              <p className="mb-2 font-medium text-[color:var(--color-text)]">Projekt: {currentProjectLabel}</p>
            ) : null}
            {autoLegalBreakPresent ? (
              <p className="mb-2 text-[color:var(--color-text)]">
                Eine gesetzliche Mindestpause wurde automatisch ergänzt und bleibt im Tagesablauf sichtbar.
              </p>
            ) : null}
            <p>
              {openBreak
                ? "Ihre Pause läuft aktuell. Erst nach dem Pausenende kann der Arbeitstag abgeschlossen werden."
                : entry?.approval_status === "pending"
                  ? "Der heutige Eintrag wurde bereits eingereicht und wartet auf Freigabe."
                  : "Für Nachträge oder Korrekturen steht die Wochenansicht mit manueller Erfassung bereit."}
            </p>
          </div>

          <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                Schnellzugriff
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                Woche, Abwesenheiten und Korrekturen bleiben direkt erreichbar.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Link
                href={weekHref}
                className="rounded-2xl border border-[color:var(--color-border-soft)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--color-text)]"
              >
                Woche prüfen
              </Link>
              <Link
                href={leaveHref}
                className="rounded-2xl border border-[color:var(--color-border-soft)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--color-text)]"
              >
                Abwesenheit
              </Link>
              <Link
                href={correctionsHref}
                className="rounded-2xl border border-[color:var(--color-border-soft)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--color-text)]"
              >
                Korrekturen
              </Link>
            </div>
          </div>

          <FormMessage message={message} />
          <FormMessage message={success} tone="success" />
        </div>
      </div>
    </Panel>
  );
}
