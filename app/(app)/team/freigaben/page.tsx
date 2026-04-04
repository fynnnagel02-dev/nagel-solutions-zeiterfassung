import { ApprovalSection } from "@/src/components/team/ApprovalQueue";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { requireTeamAccess } from "@/src/lib/auth/route-guards";
import { getApprovalCenterData } from "@/src/lib/db/queries/frontoffice";

export default async function TeamApprovalsPage() {
  await requireTeamAccess();
  const approvals = await getApprovalCenterData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teamleitung"
        title="Freigaben"
        description="Diese Ansicht priorisiert operative Entscheidungen zuerst nach Dringlichkeit und erst danach nach Art der Anfrage."
      />

      <ApprovalSection
        title="Heute kritisch"
        description="Anfragen mit unmittelbarer Relevanz für den heutigen operativen Ablauf."
        emptyTitle="Heute sind keine kritischen Freigaben offen."
        emptyDescription="Aktuell gibt es keine heute-bezogenen Freigaben, die sofortiges Handeln erfordern."
        items={approvals.urgentToday}
      />
      <ApprovalSection
        title="Überfällig"
        description="Anfragen, die bereits seit längerer Zeit offen sind und zeitnah entschieden werden sollten."
        emptyTitle="Es gibt aktuell keine überfälligen Freigaben."
        emptyDescription="Alle offenen Vorgänge liegen noch innerhalb des normalen Entscheidungsfensters."
        items={approvals.overdue}
      />
      <ApprovalSection
        title="Korrekturen"
        description="Korrekturanfragen erfordern den direkten Vergleich zwischen aktuellem Eintrag und gewünschter Änderung."
        emptyTitle="Zurzeit liegen keine Korrekturanfragen vor."
        emptyDescription="Sobald Mitarbeitende Anpassungen zu freigegebenen oder gesperrten Einträgen anfragen, erscheinen sie hier."
        items={approvals.corrections}
      />
      <ApprovalSection
        title="Abwesenheiten"
        description="Normale Abwesenheitsanträge ohne direkte Dringlichkeit."
        emptyTitle="Keine offenen Abwesenheitsanträge in diesem Bereich."
        emptyDescription="Momentan warten keine weiteren Abwesenheitsanträge in dieser Prioritätsstufe."
        items={approvals.leave}
      />
      <ApprovalSection
        title="Zeiteinträge"
        description="Normale Zeiteinträge, die nicht in die höher priorisierten Bereiche fallen."
        emptyTitle="Keine offenen Zeiteinträge in diesem Bereich."
        emptyDescription="Derzeit gibt es keine weiteren standardmäßigen Zeiteinträge zur Freigabe."
        items={approvals.time}
      />
    </div>
  );
}
