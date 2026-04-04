import Link from "next/link";

import { EmptyState } from "@/src/components/shared/EmptyState";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { Panel } from "@/src/components/shared/Panel";
import { requireAdminAccess } from "@/src/lib/auth/route-guards";
import { getMonthlyEmployeeSummary } from "@/src/lib/db/queries/dashboard";
import { getAdminSelectionOptions } from "@/src/lib/db/queries/frontoffice";
import { formatMinutes, getMonthOptions } from "@/src/lib/presentation/format";

type SearchParams = Promise<{
  employeeId?: string;
  year?: string;
  month?: string;
}>;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminAccess();
  const params = await searchParams;
  const options = await getAdminSelectionOptions();
  const employeeId = params.employeeId ?? options.employees[0]?.id;
  const year = Number(params.year ?? new Date().getUTCFullYear());
  const month = Number(params.month ?? new Date().getUTCMonth() + 1);
  const monthOptions = getMonthOptions(year);
  const summary = employeeId ? await getMonthlyEmployeeSummary(employeeId, year, month) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Steuerung"
        title="Auswertungen"
        description="Monatsauswertungen bleiben bewusst fokussiert: ein Mensch, ein Zeitraum, klare Soll-/Ist-Werte und Abwesenheitskontext."
      />

      <Panel className="space-y-4">
        <form className="grid gap-4 md:grid-cols-4">
          <label className="space-y-2">
            <span className="block text-sm font-medium text-[color:var(--color-text)]">Mitarbeitende</span>
            <select name="employeeId" defaultValue={employeeId} className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm">
              {options.employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-[color:var(--color-text)]">Jahr</span>
            <input name="year" type="number" defaultValue={year} className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" />
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
          <div className="flex items-end">
            <button className="w-full rounded-2xl bg-[color:var(--color-sidebar)] px-4 py-3 text-sm font-semibold text-white">Auswertung laden</button>
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
        <Link href="/verwaltung/steuerung/exporte" className="inline-flex text-sm font-semibold text-[color:var(--color-sidebar)]">
          Direkt zu den Exporten
        </Link>
      </Panel>
    </div>
  );
}
