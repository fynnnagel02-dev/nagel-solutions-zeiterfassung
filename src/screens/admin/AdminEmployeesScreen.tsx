import { EmployeeAdminForm, EmployeeRowActions } from "@/src/components/admin/AdminForms";
import { DialogLauncher } from "@/src/components/shared/DialogLauncher";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { Panel } from "@/src/components/shared/Panel";
import { StatusChip } from "@/src/components/shared/StatusChip";
import { requireAdminAccess } from "@/src/lib/auth/route-guards";
import { getAdminEmployeesOverview, getAdminSelectionOptions } from "@/src/lib/db/queries/frontoffice";

export async function AdminEmployeesScreen() {
  await requireAdminAccess();
  const [employees, options] = await Promise.all([getAdminEmployeesOverview(), getAdminSelectionOptions()]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Stammdaten"
        title="Mitarbeitende"
        description="Personen, Rollen und Zuordnungen werden hier zentral gepflegt. Rollen- und Scope-Regeln bleiben vollständig serverseitig."
      />

      <DialogLauncher
        buttonLabel="Neu anlegen"
        title="Mitarbeitende anlegen"
        description="Neue Personen werden mit Rolle, Team und Arbeitszeitmodell verknüpft."
      >
        <EmployeeAdminForm teams={options.teams} schedules={options.schedules} />
      </DialogLauncher>

      <Panel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[color:var(--color-panel-soft)] text-[color:var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Rolle</th>
                <th className="px-5 py-4 font-medium">Team</th>
                <th className="px-5 py-4 font-medium">Arbeitszeitmodell</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const role = Array.isArray(employee.profiles) ? employee.profiles[0]?.role : employee.profiles?.role;
                const isActive = Array.isArray(employee.profiles)
                  ? employee.profiles[0]?.is_active
                  : employee.profiles?.is_active;

                return (
                  <tr key={employee.id} className="border-t border-[color:var(--color-border-soft)] align-top">
                    <td className="px-5 py-4 font-medium text-[color:var(--color-text)]">
                      {employee.first_name} {employee.last_name}
                    </td>
                    <td className="px-5 py-4 text-[color:var(--color-text-soft)]">{role ?? "employee"}</td>
                    <td className="px-5 py-4 text-[color:var(--color-text-soft)]">
                      {employee.team?.name ?? "Kein Team"}
                    </td>
                    <td className="px-5 py-4 text-[color:var(--color-text-soft)]">
                      {employee.workSchedule?.name ?? "Kein Modell"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusChip
                        label={isActive === false ? "Inaktiv" : "Aktiv"}
                        tone={isActive === false ? "neutral" : "success"}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <EmployeeRowActions employee={employee} teams={options.teams} schedules={options.schedules} />
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
