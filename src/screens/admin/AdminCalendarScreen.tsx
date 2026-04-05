import { PageHeader } from "@/src/components/shared/PageHeader";
import { Panel } from "@/src/components/shared/Panel";
import { YearAbsenceCalendar } from "@/src/components/shared/YearAbsenceCalendar";
import { requireAdminAccess } from "@/src/lib/auth/route-guards";
import { getAbsenceCalendarData } from "@/src/lib/db/queries/frontoffice";
import { getAppRuntimeState } from "@/src/lib/demo/runtime";

type AdminCalendarSearchParams = Promise<{
  year?: string;
  month?: string;
  teamId?: string;
}>;

export async function AdminCalendarScreen({
  searchParams,
}: {
  searchParams: AdminCalendarSearchParams;
}) {
  await requireAdminAccess();
  const runtime = await getAppRuntimeState();
  const params = await searchParams;
  const year = Number(params.year ?? new Date().getUTCFullYear());
  const month = Number(params.month ?? new Date().getUTCMonth() + 1);
  const calendar = await getAbsenceCalendarData({ year, month, teamId: params.teamId ?? null });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Steuerung"
        title="Kalender"
        description="Monatsplaner über Abwesenheiten und Feiertage. Für breite Teamplanung, aber mit ruhiger, operativer Lesbarkeit."
      />
      <Panel>
        <form className="grid gap-4 md:grid-cols-3">
          {runtime.isDemo ? <input type="hidden" name="role" value={runtime.role} /> : null}
          {runtime.isDemo && runtime.embed ? <input type="hidden" name="embed" value="true" /> : null}
          <input
            name="year"
            type="number"
            defaultValue={calendar.year}
            className="rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm"
          />
          <select
            name="month"
            defaultValue={String(calendar.month)}
            className="rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm"
          >
            {Array.from({ length: 12 }, (_, index) => {
              const date = new Date(Date.UTC(calendar.year, index, 1));
              const label = new Intl.DateTimeFormat("de-DE", { month: "long" }).format(date);
              return (
                <option key={index + 1} value={index + 1}>
                  {label.replace(/^\w/, (value) => value.toUpperCase())}
                </option>
              );
            })}
          </select>
          <select
            name="teamId"
            defaultValue={params.teamId ?? ""}
            className="rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm"
          >
            <option value="">Alle Teams</option>
            {calendar.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <button className="rounded-2xl bg-[color:var(--color-sidebar)] px-4 py-3 text-sm font-semibold text-white md:col-span-3">
            Kalender laden
          </button>
        </form>
      </Panel>
      <YearAbsenceCalendar
        year={calendar.year}
        month={calendar.month}
        employees={calendar.employees}
        leaveRequests={calendar.leaveRequests}
        holidays={calendar.holidays}
      />
    </div>
  );
}
