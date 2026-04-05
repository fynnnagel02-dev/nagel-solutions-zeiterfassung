import {
  CorrectionRequestForm,
  WithdrawCorrectionButton,
} from "@/src/components/employee/CorrectionRequestForm";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { Panel } from "@/src/components/shared/Panel";
import { StatusChip } from "@/src/components/shared/StatusChip";
import { requireEmployeeSession } from "@/src/lib/auth/route-guards";
import { getMyCorrectionOverview, getProjectOptionsForEmployee } from "@/src/lib/db/queries/frontoffice";
import { formatClock, formatDate, formatDateTime } from "@/src/lib/presentation/format";
import { getChangeRequestStatusPresentation } from "@/src/lib/presentation/status";

export async function CorrectionsScreen() {
  await requireEmployeeSession();
  const [overview, projects] = await Promise.all([
    getMyCorrectionOverview(),
    getProjectOptionsForEmployee(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mitarbeitende"
        title="Korrekturen"
        description="Nur freigegebene oder gesperrte Einträge können hier als Korrektur angefragt werden. Die Entscheidung bleibt vollständig servergeführt."
      />

      <Panel className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--color-text)]">
            Korrekturfähige Einträge
          </h2>
          <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">
            Für genehmigte oder gesperrte Tage kann eine Korrektur mit Begründung eingereicht werden.
          </p>
        </div>
        <div className="space-y-4">
          {overview.eligibleEntries.length === 0 ? (
            <EmptyState
              title="Zurzeit gibt es keine freigegebenen oder gesperrten Einträge."
              description="Sobald Einträge abgeschlossen und nicht mehr direkt bearbeitbar sind, können Sie hier eine Korrektur anfragen."
            />
          ) : (
            overview.eligibleEntries.map((entry) => (
              <Panel
                key={entry.id}
                className="space-y-3 border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--color-text)]">
                      {formatDate(entry.entry_date)}
                    </h3>
                    <p className="text-sm tabular-nums text-[color:var(--color-text-soft)]">
                      {formatClock(entry.started_at)} - {formatClock(entry.ended_at)}
                    </p>
                  </div>
                  <CorrectionRequestForm
                    timeEntryId={entry.id}
                    projects={projects}
                    currentProjectId={entry.project_id}
                  />
                </div>
              </Panel>
            ))
          )}
        </div>
      </Panel>

      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--color-text)]">
            Eigene Anfragen
          </h2>
          <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">
            Der aktuelle Status wird aus den serverseitigen Entscheidungsdaten abgeleitet.
          </p>
        </div>
        {overview.requests.length === 0 ? (
          <EmptyState
            title="Noch keine Korrekturanfragen vorhanden."
            description="Sobald Sie eine Änderung zu einem bereits freigegebenen oder gesperrten Eintrag anfragen, erscheint sie hier."
          />
        ) : (
          overview.requests.map((request) => {
            const status = getChangeRequestStatusPresentation(request.status);

            return (
              <Panel key={request.id} className="space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--color-text)]">
                        {formatDate(
                          Array.isArray(request.time_entries)
                            ? request.time_entries[0]?.entry_date
                            : request.time_entries?.entry_date
                        )}
                      </h3>
                      <StatusChip label={status.label} tone={status.tone} />
                    </div>
                    <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">{request.reason}</p>
                    <p className="text-xs text-[color:var(--color-text-muted)]">
                      Angefragt am {formatDateTime(request.created_at)}
                    </p>
                  </div>
                  {request.status === "pending" ? <WithdrawCorrectionButton requestId={request.id} /> : null}
                </div>
              </Panel>
            );
          })
        )}
      </div>
    </div>
  );
}
