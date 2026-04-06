import Link from "next/link";

import { TimeActionCard } from "@/src/components/employee/TimeActionCard";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { Panel } from "@/src/components/shared/Panel";
import { requireEmployeeSession } from "@/src/lib/auth/route-guards";
import { getCompanyContext, getMyTodayTimeEntry, getMyWeekOverview } from "@/src/lib/db/queries/dashboard";
import { getProjectOptionsForEmployee } from "@/src/lib/db/queries/frontoffice";
import { buildAppHref } from "@/src/lib/demo/paths";
import { getAppRuntimeState } from "@/src/lib/demo/runtime";
import { formatMinutes, formatWeekdayShort, getTodayDateKey } from "@/src/lib/presentation/format";
import { getTimeEntryStatusPresentation } from "@/src/lib/presentation/status";

type BreakInfo = { ended_at: string | null };

export async function TodayScreen() {
  await requireEmployeeSession();
  const runtime = await getAppRuntimeState();
  const [company, entry, week, projects] = await Promise.all([
    getCompanyContext(),
    getMyTodayTimeEntry(),
    getMyWeekOverview(),
    getProjectOptionsForEmployee(),
  ]);

  const weekWorkedMinutes = week.reduce((sum, current) => sum + current.computedWorkedMinutes, 0);
  const weekTargetMinutes = week.reduce((sum, current) => sum + current.targetMinutes, 0);
  const pendingWeekEntries = week.filter((current) => current.approval_status === "pending").length;
  const openTodayEntry = week.find((current) => current.entry_date === getTodayDateKey()) ?? null;
  const todayStatus = openTodayEntry
    ? getTimeEntryStatusPresentation(
        openTodayEntry.status,
        openTodayEntry.approval_status,
        Boolean(openTodayEntry.time_entry_breaks?.some((item: BreakInfo) => !item.ended_at))
      )
    : { label: "Noch keine Buchung", tone: "neutral" as const };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mitarbeitende"
        title="Heute"
        description="Arbeitszeit buchen, Tagesstatus prüfen und ohne Umwege in Woche, Abwesenheiten oder Korrekturen weitergehen."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href={buildAppHref("/woche", runtime)}
              className="inline-flex rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--color-text)]"
            >
              Zur Woche
            </Link>
            <Link
              href={buildAppHref("/abwesenheiten", runtime)}
              className="inline-flex rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--color-text)]"
            >
              Abwesenheit melden
            </Link>
          </div>
        }
      />

      <TimeActionCard entry={entry} projects={projects} />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                Woche im Blick
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[color:var(--color-text)]">
                Heute und Woche greifen direkt ineinander
              </h2>
            </div>
            <Link href={buildAppHref("/woche", runtime)} className="text-sm font-semibold text-[color:var(--color-sidebar)]">
              Wochenansicht
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                Arbeitszeit diese Woche
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[color:var(--color-text)]">
                {formatMinutes(weekWorkedMinutes)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                Ziel diese Woche
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[color:var(--color-text)]">
                {formatMinutes(weekTargetMinutes)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                Offene Freigaben
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[color:var(--color-text)]">
                {pendingWeekEntries}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => {
              const current = new Date();
              const day = current.getUTCDay() || 7;
              current.setUTCDate(current.getUTCDate() - day + 1 + index);
              const key = current.toISOString().slice(0, 10);
              const dayEntry = week.find((item) => item.entry_date === key);
              const status = dayEntry
                ? getTimeEntryStatusPresentation(
                    dayEntry.status,
                    dayEntry.approval_status,
                    Boolean(dayEntry.time_entry_breaks?.some((item: BreakInfo) => !item.ended_at))
                  )
                : { label: "Keine Buchung", tone: "neutral" as const };

              return (
                <div
                  key={key}
                  className={`rounded-[1.35rem] border px-4 py-3 ${
                    key === getTodayDateKey()
                      ? "border-[color:var(--color-border-strong)] bg-white shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
                      : "border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)]"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                    {formatWeekdayShort(current)}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">{status.label}</p>
                  <p className="mt-1 text-sm tabular-nums text-[color:var(--color-text-soft)]">
                    {formatMinutes(dayEntry?.computedWorkedMinutes ?? 0)}
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
              Orientierung
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[color:var(--color-text)]">
              Heute zählt nur der bestätigte Kontext
            </h2>
          </div>

          <div className="space-y-3">
            <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                Unternehmen
              </p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">{company.companyName}</p>
              <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                Zeitzone {company.timezone}, Feiertagsregion {company.holidayRegionCode}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                Status heute
              </p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">{todayStatus.label}</p>
              <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                Live-Buchungen, Pause und Freigabestatus folgen immer demselben Modell wie in der Woche.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-4 text-sm leading-6 text-[color:var(--color-text-soft)]">
              Wenn heute keine Buchung vorliegt, erfassen Sie Nachträge in der Wochenansicht. Urlaub und
              Korrekturen bleiben eigene Prozesse, greifen aber auf denselben serverbestätigten
              Arbeitszeitkontext zurück.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
