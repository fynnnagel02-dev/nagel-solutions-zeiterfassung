import { EmptyState } from "@/src/components/shared/EmptyState";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { Panel } from "@/src/components/shared/Panel";
import { StatusChip } from "@/src/components/shared/StatusChip";
import { requireTeamAccess } from "@/src/lib/auth/route-guards";
import { getTeamTodayOverview } from "@/src/lib/db/queries/dashboard";
import { getLeaveTypeLabel } from "@/src/lib/presentation/leave";
import { formatMinutes } from "@/src/lib/presentation/format";
import { getPresencePresentation } from "@/src/lib/presentation/status";

export async function TeamTodayScreen() {
  await requireTeamAccess();
  const overview = await getTeamTodayOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teamleitung"
        title="Team heute"
        description="Ein schneller operativer Blick auf den heutigen Stand im Team: wer aktiv ist, wer fehlt und wo Aufmerksamkeit gebraucht wird."
      />

      {overview.length === 0 ? (
        <EmptyState
          title="Für Ihr Team liegen aktuell keine aktiven Mitarbeitenden vor."
          description="Sobald Personen im Team aktiv zugeordnet sind, erscheint hier die operative Tagesübersicht."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {overview.map((item) => {
            const hasOpenBreak = Boolean(
              item.timeEntry?.time_entry_breaks?.some(
                (entry: { ended_at: string | null }) => !entry.ended_at
              )
            );
            const presence = getPresencePresentation({
              hasEntry: Boolean(item.timeEntry),
              hasOpenBreak,
              hasActiveAbsence: Boolean(item.activeAbsence),
            });

            return (
              <Panel key={item.employee.id} className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--color-text)]">
                        {item.employee.first_name} {item.employee.last_name}
                      </h2>
                      <StatusChip label={presence.label} tone={presence.tone} />
                    </div>
                    <p className="text-sm text-[color:var(--color-text-soft)]">
                      {item.activeAbsence
                        ? `Abwesenheit: ${getLeaveTypeLabel(item.activeAbsence.leave_type)}`
                        : "Heute im operativen Blick"}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm tabular-nums text-[color:var(--color-text-soft)]">
                    {item.timeEntry ? formatMinutes(item.timeEntry.computedWorkedMinutes) : "--"}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                      Arbeitszeit
                    </p>
                    <p className="mt-2 text-lg font-semibold tabular-nums text-[color:var(--color-text)]">
                      {item.timeEntry ? formatMinutes(item.timeEntry.computedWorkedMinutes) : "--"}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                      Pause
                    </p>
                    <p className="mt-2 text-lg font-semibold tabular-nums text-[color:var(--color-text)]">
                      {item.timeEntry ? formatMinutes(item.timeEntry.computedBreakMinutes) : "--"}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                      Hinweis
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">
                      {item.timeEntry
                        ? item.timeEntry.projects?.name
                          ? `Projekt ${item.timeEntry.projects.name}`
                          : item.timeEntry.time_entry_breaks?.some(
                                (entry: { source?: string | null }) => entry.source === "auto_legal"
                              )
                            ? "Gesetzliche Pause automatisch ergänzt"
                            : "Eintrag vorhanden"
                        : item.activeAbsence
                          ? "Abwesenheit aktiv"
                          : "Noch keine Buchung"}
                    </p>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
