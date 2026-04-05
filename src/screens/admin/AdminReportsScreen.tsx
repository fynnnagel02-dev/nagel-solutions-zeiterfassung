import Link from "next/link";

import { EmptyState } from "@/src/components/shared/EmptyState";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { Panel } from "@/src/components/shared/Panel";
import { requireAdminAccess } from "@/src/lib/auth/route-guards";
import { getMonthlyEmployeeSummary, getMonthlyProjectSummary } from "@/src/lib/db/queries/dashboard";
import { getAdminSelectionOptions } from "@/src/lib/db/queries/frontoffice";
import { buildAppHref } from "@/src/lib/demo/paths";
import { getAppRuntimeState } from "@/src/lib/demo/runtime";
import { formatMinutes, getMonthOptions } from "@/src/lib/presentation/format";

type AdminReportsSearchParams = Promise<{
  employeeId?: string;
  year?: string;
  month?: string;
  teamId?: string;
}>;

export async function AdminReportsScreen({
  searchParams,
}: {
  searchParams: AdminReportsSearchParams;
}) {
  await requireAdminAccess();
  const runtime = await getAppRuntimeState();
  const params = await searchParams;
  const options = await getAdminSelectionOptions();
  const employeeId = params.employeeId ?? options.employees[0]?.id;
  const teamId = params.teamId ?? "";
  const year = Number(params.year ?? new Date().getUTCFullYear());
  const month = Number(params.month ?? new Date().getUTCMonth() + 1);
  const monthOptions = getMonthOptions(year);
  const [summary, projectSummary] = await Promise.all([
    employeeId ? getMonthlyEmployeeSummary(employeeId, year, month) : null,
    getMonthlyProjectSummary(year, month, teamId || null),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Steuerung"
        title="Auswertungen"
        description="Monatsauswertungen bleiben bewusst fokussiert: ein Mensch, ein Zeitraum, klare Soll-/Ist-Werte und Abwesenheitskontext."
      />

      <Panel className="space-y-4">
        <form className="grid gap-4 md:grid-cols-5">
          {runtime.isDemo ? <input type="hidden" name="role" value={runtime.role} /> : null}
          {runtime.isDemo && runtime.embed ? <input type="hidden" name="embed" value="true" /> : null}
          <label className="space-y-2">
            <span className="block text-sm font-medium text-[color:var(--color-text)]">Mitarbeitende</span>
            <select
              name="employeeId"
              defaultValue={employeeId}
              className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm"
            >
              {options.employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-[color:var(--color-text)]">Jahr</span>
            <input
              name="year"
              type="number"
              defaultValue={year}
              className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm"
            />
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-[color:var(--color-text)]">Monat</span>
            <select
              name="month"
              defaultValue={month}
              className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-[color:var(--color-text)]">Teamfilter</span>
            <select
              name="teamId"
              defaultValue={teamId}
              className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm"
            >
              <option value="">Alle Teams</option>
              {options.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button className="w-full rounded-2xl bg-[color:var(--color-sidebar)] px-4 py-3 text-sm font-semibold text-white">
              Auswertung laden
            </button>
          </div>
        </form>
      </Panel>

      {summary ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel className="space-y-2">
            <p className="text-sm text-[color:var(--color-text-muted)]">Arbeitszeit</p>
            <p className="text-3xl font-semibold tabular-nums">{formatMinutes(summary.workedMinutes)}</p>
          </Panel>
          <Panel className="space-y-2">
            <p className="text-sm text-[color:var(--color-text-muted)]">Zielzeit</p>
            <p className="text-3xl font-semibold tabular-nums">{formatMinutes(summary.targetMinutes)}</p>
          </Panel>
          <Panel className="space-y-2">
            <p className="text-sm text-[color:var(--color-text-muted)]">Delta</p>
            <p className="text-3xl font-semibold tabular-nums">{formatMinutes(summary.deltaMinutes)}</p>
          </Panel>
        </div>
      ) : (
        <EmptyState
          title="Noch keine Auswertung gewählt."
          description="Wählen Sie Mitarbeitende und Monat aus, um die serverseitige Monatsauswertung zu laden."
        />
      )}

      <Panel className="space-y-3">
        <p className="text-sm text-[color:var(--color-text-soft)]">
          Genehmigte Urlaubstage im Zeitraum: {summary?.approvedVacationCount ?? 0}
        </p>
        <p className="text-sm text-[color:var(--color-text-soft)]">
          Kranktage im Zeitraum: {summary?.sickCount ?? 0}
        </p>
        <Link
          href={buildAppHref("/verwaltung/steuerung/exporte", runtime)}
          className="inline-flex text-sm font-semibold text-[color:var(--color-sidebar)]"
        >
          Direkt zu den Exporten
        </Link>
      </Panel>

      <Panel className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em]">Projekt-KPI</h2>
            <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">
              Monatliche Verteilung der gebuchten Stunden pro Projekt.
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm">
            Gesamt {formatMinutes(projectSummary.totalWorkedMinutes)}
          </div>
        </div>

        {projectSummary.projects.length === 0 ? (
          <EmptyState
            title="Keine Projektstunden im gewählten Zeitraum."
            description="Sobald Einträge mit Projektbezug vorliegen, erscheint hier die Monatsverteilung."
          />
        ) : (
          <div className="space-y-3">
            {projectSummary.projects.map((project) => (
              <div
                key={project.projectId}
                className="flex flex-col gap-3 rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-[color:var(--color-text)]">{project.projectName}</p>
                  <p className="text-xs text-[color:var(--color-text-muted)]">
                    {project.projectCode ?? "Ohne Code"} · {project.entryCount} Einträge
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold tabular-nums text-[color:var(--color-text)]">
                    {formatMinutes(project.workedMinutes)}
                  </p>
                  <p className="text-xs text-[color:var(--color-text-muted)]">{project.sharePercent}% Anteil</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
