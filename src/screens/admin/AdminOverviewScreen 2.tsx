import Link from "next/link";

import { Panel } from "@/src/components/shared/Panel";
import { StatusChip } from "@/src/components/shared/StatusChip";
import { requireAdminAccess } from "@/src/lib/auth/route-guards";
import { getAdminDashboardSummary, getPendingApprovalsForMyScope } from "@/src/lib/db/queries/dashboard";
import { buildAppHref } from "@/src/lib/demo/paths";
import { getAppRuntimeState } from "@/src/lib/demo/runtime";
import { formatDate } from "@/src/lib/presentation/format";

export async function AdminOverviewScreen() {
  await requireAdminAccess();
  const runtime = await getAppRuntimeState();
  const [summary, approvals] = await Promise.all([
    getAdminDashboardSummary(),
    getPendingApprovalsForMyScope(),
  ]);
  const today = formatDate(new Date());
  const urgentApprovalCount =
    approvals.changeRequests.length + approvals.leaveRequests.length + approvals.timeEntries.length;

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5 bg-[linear-gradient(180deg,rgba(17,32,57,0.98),rgba(23,40,69,0.98))] px-6 py-7 text-white">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Heute</p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em]">Willkommen in der Steuerung</h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-200/90">
                {today}. Diese Fläche bündelt offene Entscheidungen, Teamstatus und die nächsten sinnvollen
                Wege in die Stammdaten oder operative Steuerung.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/7 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Aktive Mitarbeitende</p>
                <p className="mt-2 text-4xl font-semibold">{summary.activeEmployees}</p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/7 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Buchungen heute</p>
                <p className="mt-2 text-4xl font-semibold">{summary.todayEntries}</p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/7 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Offene Entscheidungen</p>
                <p className="mt-2 text-4xl font-semibold">{urgentApprovalCount}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Link
                href={buildAppHref("/verwaltung/steuerung/freigaben", runtime)}
                className="rounded-[1.2rem] border border-white/10 bg-black/10 px-4 py-3 text-sm font-semibold text-white"
              >
                Zu Freigaben
              </Link>
              <Link
                href={buildAppHref("/verwaltung/steuerung/kalender", runtime)}
                className="rounded-[1.2rem] border border-white/10 bg-black/10 px-4 py-3 text-sm font-semibold text-white"
              >
                Zum Kalender
              </Link>
              <Link
                href={buildAppHref("/verwaltung/einstellungen", runtime)}
                className="rounded-[1.2rem] border border-white/10 bg-black/10 px-4 py-3 text-sm font-semibold text-white"
              >
                Zu Einstellungen
              </Link>
            </div>
          </div>

          <div className="space-y-4 bg-white px-6 py-7">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                Operativer Fokus
              </p>
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[color:var(--color-text)]">
                Was heute ansteht
              </h3>
            </div>

            <div className="space-y-3">
              <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[color:var(--color-text)]">Zeitfreigaben</p>
                  <StatusChip
                    label={`${summary.pendingTimeEntries}`}
                    tone={summary.pendingTimeEntries > 0 ? "warning" : "success"}
                  />
                </div>
                <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">
                  Offene Zeiteinträge mit Entscheidungsbedarf.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[color:var(--color-text)]">Abwesenheiten</p>
                  <StatusChip
                    label={`${summary.pendingLeaveRequests}`}
                    tone={summary.pendingLeaveRequests > 0 ? "warning" : "success"}
                  />
                </div>
                <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">
                  Genehmigungen oder Rückmeldungen zu Urlaub und Krankheit.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4">
                <p className="text-sm font-semibold text-[color:var(--color-text)]">Korrekturen</p>
                <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">
                  {approvals.changeRequests.length} Korrekturen warten aktuell auf Vergleich und Entscheidung.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
