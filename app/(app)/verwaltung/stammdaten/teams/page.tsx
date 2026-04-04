import { TeamAdminForm, TeamRowActions } from "@/src/components/admin/AdminForms";
import { DialogLauncher } from "@/src/components/shared/DialogLauncher";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { Panel } from "@/src/components/shared/Panel";
import { StatusChip } from "@/src/components/shared/StatusChip";
import { requireAdminAccess } from "@/src/lib/auth/route-guards";
import { getAdminSelectionOptions, getAdminTeamsOverview } from "@/src/lib/db/queries/frontoffice";

export default async function AdminTeamsPage() {
  await requireAdminAccess();
  const [teams, options] = await Promise.all([getAdminTeamsOverview(), getAdminSelectionOptions()]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Stammdaten"
        title="Teams"
        description="Teamstruktur und Teamleitungen werden bewusst getrennt von den operativen Lead-Flächen gepflegt."
      />

      <DialogLauncher
        buttonLabel="Neu anlegen"
        title="Team anlegen"
        description="Neue Teams werden zentral gepflegt und später mit Mitgliedern befüllt."
      >
        <TeamAdminForm />
      </DialogLauncher>

      <Panel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[color:var(--color-panel-soft)] text-[color:var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">Team</th>
                <th className="px-5 py-4 font-medium">Mitglieder</th>
                <th className="px-5 py-4 font-medium">Teamleitung</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const leadMember = team.members.find(
                  (member: { id: string; first_name: string; last_name: string }) =>
                    member.id === team.team_lead_employee_id
                );

                return (
                  <tr key={team.id} className="border-t border-[color:var(--color-border-soft)] align-top">
                    <td className="px-5 py-4 font-medium text-[color:var(--color-text)]">{team.name}</td>
                    <td className="px-5 py-4 text-[color:var(--color-text-soft)]">{team.members.length}</td>
                    <td className="px-5 py-4 text-[color:var(--color-text-soft)]">
                      {leadMember ? `${leadMember.first_name} ${leadMember.last_name}` : "Nicht gesetzt"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusChip label={team.is_active ? "Aktiv" : "Inaktiv"} tone={team.is_active ? "success" : "neutral"} />
                    </td>
                    <td className="px-5 py-4">
                      <TeamRowActions team={team} employees={options.employees} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
