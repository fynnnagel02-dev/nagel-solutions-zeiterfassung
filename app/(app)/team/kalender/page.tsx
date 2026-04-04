import { PageHeader } from "@/src/components/shared/PageHeader";
import { requireTeamAccess } from "@/src/lib/auth/route-guards";
import { getAbsenceCalendarData } from "@/src/lib/db/queries/frontoffice";
import { YearAbsenceCalendar } from "@/src/components/shared/YearAbsenceCalendar";

type SearchParams = Promise<{
  year?: string;
  month?: string;
}>;

export default async function TeamCalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
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
