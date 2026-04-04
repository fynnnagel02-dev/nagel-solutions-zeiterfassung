import { HolidayCalendarBoard } from "@/src/components/admin/HolidayCalendarBoard";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { requireAdminAccess } from "@/src/lib/auth/route-guards";
import { getAdminHolidaysOverview } from "@/src/lib/db/queries/frontoffice";

export default async function AdminHolidaysPage() {
  await requireAdminAccess();
  const holidays = await getAdminHolidaysOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Stammdaten"
        title="Feiertage"
        description="Feiertage werden direkt im Kalender gepflegt. Details, Bearbeitung und Löschen erfolgen aus dem jeweiligen Termin heraus."
      />
      <HolidayCalendarBoard holidays={holidays} year={new Date().getUTCFullYear()} />
    </div>
  );
}
