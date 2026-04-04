import { ApprovalSection } from "@/src/components/team/ApprovalQueue";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { requireAdminAccess } from "@/src/lib/auth/route-guards";
import { getApprovalCenterData } from "@/src/lib/db/queries/frontoffice";

export default async function AdminApprovalsPage() {
  await requireAdminAccess();
  const approvals = await getApprovalCenterData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Steuerung"
        title="Freigaben"
        description="Die zentrale Freigabefläche priorisiert Vorgänge nach Dringlichkeit und erlaubt dieselbe Entscheidungslogik wie in der Teamleitung, jedoch mit größerem Scope."
      />
      <ApprovalSection
        title="Heute kritisch"
        description="Anfragen mit unmittelbarer Relevanz für den aktuellen operativen Tag."
        emptyTitle="Heute sind keine kritischen Freigaben offen."
        emptyDescription="Aktuell gibt es keine heute-bezogenen Vorgänge mit hoher Priorität."
        items={approvals.urgentToday}
      />
      <ApprovalSection
        title="Überfällig"
        description="Vorgänge, die bereits zu lange offen sind und sichtbar priorisiert werden sollen."
        emptyTitle="Es gibt aktuell keine überfälligen Freigaben."
        emptyDescription="Derzeit liegen keine überfälligen Entscheidungen im System."
        items={approvals.overdue}
      />
      <ApprovalSection
        title="Korrekturen"
        description="Korrekturanfragen mit direktem Vorher/Nachher-Vergleich."
        emptyTitle="Zurzeit liegen keine Korrekturanfragen vor."
        emptyDescription="Sobald Änderungen an freigegebenen Einträgen vorliegen, erscheinen sie in diesem Bereich."
        items={approvals.corrections}
      />
      <ApprovalSection
        title="Abwesenheiten"
        description="Normale Abwesenheitsfreigaben ohne erhöhte Priorität."
        emptyTitle="Keine offenen Abwesenheitsanträge in diesem Bereich."
        emptyDescription="Momentan sind hier keine weiteren Abwesenheitsanträge offen."
        items={approvals.leave}
      />
      <ApprovalSection
        title="Zeiteinträge"
        description="Normale Zeiteinträge außerhalb der priorisierten Abschnitte."
        emptyTitle="Keine offenen Zeiteinträge in diesem Bereich."
        emptyDescription="Momentan sind hier keine weiteren Zeiteinträge offen."
        items={approvals.time}
      />
    </div>
  );
}
