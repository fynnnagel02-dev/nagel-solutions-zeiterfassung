import { ExportTriggerForm } from "@/src/components/admin/AdminForms";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { Panel } from "@/src/components/shared/Panel";
import { requireAdminAccess } from "@/src/lib/auth/route-guards";
import { getAdminExportsOverview, getAdminSelectionOptions } from "@/src/lib/db/queries/frontoffice";
import { formatDateTime } from "@/src/lib/presentation/format";

export async function AdminExportsScreen() {
  await requireAdminAccess();
  const [logs, options] = await Promise.all([getAdminExportsOverview(), getAdminSelectionOptions()]);
  const exportTypeLabel: Record<string, string> = {
    monthly_timesheet: "Monatsexport Zeiterfassung",
    absence_report: "Abwesenheitsreport",
    team_overview: "Teamübersicht",
    project_time_report: "Projektreport",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Steuerung"
        title="Exporte"
        description="Exporte bleiben bewusst schlicht: klarer Zeitraum, klarer Scope und eine serverseitig protokollierte Ausführung."
      />

      <ExportTriggerForm employees={options.employees} teams={options.teams} />

      {logs.length === 0 ? (
        <EmptyState
          title="Noch keine Exporte protokolliert."
          description="Sobald Exportanforderungen ausgelöst werden, erscheint hier die letzte Historie."
        />
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Panel key={log.id} className="space-y-2">
              <h2 className="text-lg font-semibold tracking-[-0.03em]">
                {typeof log.scope_description?.title === "string"
                  ? log.scope_description.title
                  : exportTypeLabel[log.export_type] ?? log.export_type}
              </h2>
              <p className="text-sm text-[color:var(--color-text-soft)]">
                Status {log.status} · erstellt am {formatDateTime(log.created_at)}
              </p>
              {typeof log.artifact_ref === "string" ? (
                <p className="text-xs text-[color:var(--color-text-muted)]">{log.artifact_ref}</p>
              ) : null}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
