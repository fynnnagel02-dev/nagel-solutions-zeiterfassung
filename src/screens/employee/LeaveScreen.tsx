import { CancelLeaveButton, LeaveRequestForm } from "@/src/components/employee/LeaveRequestForm";
import { MetricCard } from "@/src/components/shared/MetricCard";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { Panel } from "@/src/components/shared/Panel";
import { StatusChip } from "@/src/components/shared/StatusChip";
import { requireEmployeeSession } from "@/src/lib/auth/route-guards";
import { getMyLeaveOverview } from "@/src/lib/db/queries/dashboard";
import { getLeaveDurationSummary, getLeaveTypeLabel } from "@/src/lib/presentation/leave";
import { formatDateRange, formatDateTime } from "@/src/lib/presentation/format";
import { getLeaveStatusPresentation } from "@/src/lib/presentation/status";

export async function LeaveScreen() {
  await requireEmployeeSession();
  const overview = await getMyLeaveOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mitarbeitende"
        title="Abwesenheiten"
        description="Urlaub und sonstige Abwesenheiten werden serverseitig geprüft. Die Oberfläche zeigt nur den aktuellen Stand und die sichere Einreichung."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Verfügbar" value={`${overview.balance.availableDays} Tage`} />
        <MetricCard label="Bereits genehmigt" value={`${overview.balance.approvedTakenDays} Tage`} />
        <MetricCard label="Ausstehend angefragt" value={`${overview.balance.pendingRequestedDays} Tage`} />
      </div>

      <Panel className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--color-text)]">
            Neue Abwesenheit beantragen
          </h2>
          <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">
            Die finale Prüfung von Überschneidungen, Sollzeit und Urlaubssaldo erfolgt vollständig im Backend.
          </p>
        </div>
        <LeaveRequestForm />
      </Panel>

      <div className="space-y-4">
        {overview.requests.map((request) => {
          const status = getLeaveStatusPresentation(request.status);
          const leaveLabel = getLeaveTypeLabel(request.leave_type);

          return (
            <Panel key={request.id} className="space-y-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--color-text)]">
                      {leaveLabel}
                    </h3>
                    <StatusChip label={status.label} tone={status.tone} />
                  </div>
                  <p className="text-sm text-[color:var(--color-text-soft)]">
                    {formatDateRange(request.start_date, request.end_date)}
                  </p>
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                    {getLeaveDurationSummary({
                      durationMode: request.duration_mode,
                      partialStartTime: request.partial_start_time,
                      partialEndTime: request.partial_end_time,
                      startDayPart: request.start_day_part,
                      endDayPart: request.end_day_part,
                    })}
                  </p>
                  {request.comment ? (
                    <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">{request.comment}</p>
                  ) : null}
                </div>
                {request.status === "pending" ? <CancelLeaveButton leaveRequestId={request.id} /> : null}
              </div>
              <p className="text-xs text-[color:var(--color-text-muted)]">
                Angefragt am {formatDateTime(request.requested_at)}
              </p>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
