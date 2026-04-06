import { PageHeader } from "@/src/components/shared/PageHeader";
import { YearAbsenceCalendar } from "@/src/components/shared/YearAbsenceCalendar";
import { requireTeamAccess } from "@/src/lib/auth/route-guards";
import { getAbsenceCalendarData } from "@/src/lib/db/queries/frontoffice";

type TeamCalendarSearchParams = Promise<{
  year?: string;
  month?: string;
}>;

export async function TeamCalendarScreen({
  searchParams,
}: {
  searchParams: TeamCalendarSearchParams;
}) {
  await requireTeamAccess();
  const params = await searchParams;
  const year = Number(params.year ?? new Date().getUTCFullYear());
  const month = Number(params.month ?? new Date().getUTCMonth() + 1);
  const calendar = await getAbsenceCalendarData({ year, month });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teamleitung"
        title="Kalender"
        description="Monatsplaner für Urlaub, Krankheit und sonstige Abwesenheiten im eigenen Team."
      />
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
