import { ManualEntryEditor } from "@/src/components/employee/ManualEntryEditor";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { Panel } from "@/src/components/shared/Panel";
import { StatusChip } from "@/src/components/shared/StatusChip";
import { requireEmployeeSession } from "@/src/lib/auth/route-guards";
import { getMyWeekOverview } from "@/src/lib/db/queries/dashboard";
import { getProjectOptionsForEmployee } from "@/src/lib/db/queries/frontoffice";
import {
  formatClock,
  formatDate,
  formatMinutes,
  formatWeekdayShort,
  getTodayDateKey,
} from "@/src/lib/presentation/format";
import { getTimeEntryStatusPresentation } from "@/src/lib/presentation/status";

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  return copy;
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function WeekScreen() {
  await requireEmployeeSession();
  const [entries, projects] = await Promise.all([getMyWeekOverview(), getProjectOptionsForEmployee()]);
  const weekStart = startOfWeek(new Date());

  const days = Array.from({ length: 7 }, (_, index) => {
    const current = new Date(weekStart);
    current.setUTCDate(weekStart.getUTCDate() + index);
    const key = dateKey(current);
    const existing = entries.find((entry) => entry.entry_date === key);

    return {
      key,
      label: formatWeekdayShort(current),
      displayDate: formatDate(current),
      entry: existing
        ? {
            id: existing.id,
            entryDate: existing.entry_date,
            startedAt: existing.started_at,
            endedAt: existing.ended_at,
            breakMinutes: existing.computedBreakMinutes,
            projectId: existing.project_id,
            comment: existing.comment,
            editable:
              !existing.locked_at &&
              existing.approval_status !== "approved" &&
              existing.status !== "approved",
          }
        : {
            entryDate: key,
            startedAt: null,
            endedAt: null,
            breakMinutes: 0,
            projectId: null,
            comment: null,
            editable: true,
          },
      rawEntry: existing ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mitarbeitende"
        title="Woche"
        description="Die Wochenansicht ist kein separates Tool, sondern die Fortsetzung von Heute: gleiche Statuslogik, gleiche Farbcodes, gleiche Zeitdarstellung."
      />

      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day) => {
          const status = day.rawEntry
            ? getTimeEntryStatusPresentation(
                day.rawEntry.status,
                day.rawEntry.approval_status,
                Boolean(
                  day.rawEntry.time_entry_breaks?.some(
                    (item: { ended_at: string | null }) => !item.ended_at
                  )
                )
              )
            : { label: day.key === getTodayDateKey() ? "Heute offen" : "Keine Buchung", tone: "neutral" as const };

          return (
            <Panel key={day.key} className="space-y-3 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                  {day.label}
                </p>
                <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[color:var(--color-text)]">
                  {day.displayDate}
                </p>
              </div>
              <StatusChip label={status.label} tone={status.tone} />
              <p className="text-sm tabular-nums text-[color:var(--color-text-soft)]">
                {day.rawEntry ? formatMinutes(day.rawEntry.computedWorkedMinutes) : "--"}
              </p>
            </Panel>
          );
        })}
      </div>

      <div className="space-y-4">
        {days.length === 0 ? (
          <EmptyState
            title="Für diese Woche liegen keine Einträge vor."
            description="Sobald Live-Buchungen oder manuelle Nachträge vorhanden sind, erscheint hier die Wochenübersicht."
          />
        ) : (
          days.map((day) => {
            const entry = day.rawEntry;
            const status = entry
              ? getTimeEntryStatusPresentation(
                  entry.status,
                  entry.approval_status,
                  Boolean(
                    entry.time_entry_breaks?.some(
                      (item: { ended_at: string | null }) => !item.ended_at
                    )
                  )
                )
              : { label: "Keine Buchung", tone: "neutral" as const };

            return (
              <Panel key={day.key} className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--color-text)]">
                        {day.label}, {day.displayDate}
                      </h2>
                      <StatusChip label={status.label} tone={status.tone} />
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm tabular-nums text-[color:var(--color-text-soft)]">
                      <span>Beginn {formatClock(entry?.started_at ?? null)}</span>
                      <span>Ende {formatClock(entry?.ended_at ?? null)}</span>
                      <span>Pause {formatMinutes(entry?.computedBreakMinutes ?? 0)}</span>
                      <span>Arbeitszeit {formatMinutes(entry?.computedWorkedMinutes ?? 0)}</span>
                      <span>Projekt {entry?.projects?.name ?? "—"}</span>
                    </div>
                  </div>

                  <ManualEntryEditor entry={day.entry} projects={projects} />
                </div>

                {entry?.comment ? (
                  <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm text-[color:var(--color-text-soft)]">
                    {entry.comment}
                  </div>
                ) : null}
              </Panel>
            );
          })
        )}
      </div>
    </div>
  );
}
