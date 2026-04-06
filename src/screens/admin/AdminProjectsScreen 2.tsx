import { ProjectAdminForm, ProjectRowActions } from "@/src/components/admin/AdminForms";
import { DialogLauncher } from "@/src/components/shared/DialogLauncher";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { Panel } from "@/src/components/shared/Panel";
import { StatusChip } from "@/src/components/shared/StatusChip";
import { requireAdminAccess } from "@/src/lib/auth/route-guards";
import { getAdminProjectsOverview } from "@/src/lib/db/queries/frontoffice";
import { formatDateTime } from "@/src/lib/presentation/format";

export async function AdminProjectsScreen() {
  await requireAdminAccess();
  const projects = await getAdminProjectsOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Stammdaten"
        title="Projekte"
        description="Projektlisten bleiben bewusst schlank und operational, damit Zeitbuchungen ohne visuelle Überladung zuordenbar bleiben."
      />

      <DialogLauncher
        buttonLabel="Neu anlegen"
        title="Projekt anlegen"
        description="Neue Projekte werden strukturiert erfasst und später aus der Tabelle heraus gepflegt."
      >
        <ProjectAdminForm />
      </DialogLauncher>

      <Panel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[color:var(--color-panel-soft)] text-[color:var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">Projekt</th>
                <th className="px-5 py-4 font-medium">Projektnummer</th>
                <th className="px-5 py-4 font-medium">Beschreibung</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Aktualisiert</th>
                <th className="px-5 py-4 font-medium">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t border-[color:var(--color-border-soft)] align-top">
                  <td className="px-5 py-4 font-medium text-[color:var(--color-text)]">{project.name}</td>
                  <td className="px-5 py-4 text-[color:var(--color-text-soft)]">{project.code || "—"}</td>
                  <td className="px-5 py-4 text-[color:var(--color-text-soft)]">
                    {project.description || "Keine Beschreibung hinterlegt."}
                  </td>
                  <td className="px-5 py-4">
                    <StatusChip
                      label={project.is_active ? "Aktiv" : "Inaktiv"}
                      tone={project.is_active ? "success" : "neutral"}
                    />
                  </td>
                  <td className="px-5 py-4 text-[color:var(--color-text-soft)]">
                    {formatDateTime(project.updated_at)}
                  </td>
                  <td className="px-5 py-4">
                    <ProjectRowActions project={project} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
