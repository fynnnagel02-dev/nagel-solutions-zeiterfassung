import {
  SettingsAdminForm,
  WorkScheduleCreateForm,
  WorkScheduleRowActions,
} from "@/src/components/admin/AdminForms";
import { DialogLauncher } from "@/src/components/shared/DialogLauncher";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { Panel } from "@/src/components/shared/Panel";
import { StatusChip } from "@/src/components/shared/StatusChip";
import { requireAdminAccess } from "@/src/lib/auth/route-guards";
import { getCompanySettingsForAdmin } from "@/src/lib/db/queries/dashboard";
import { getAdminWorkSchedulesOverview } from "@/src/lib/db/queries/frontoffice";
import { formatMinutesCompact } from "@/src/lib/presentation/format";

export async function AdminSettingsScreen() {
  await requireAdminAccess();
  const [settings, schedules] = await Promise.all([
    getCompanySettingsForAdmin(),
    getAdminWorkSchedulesOverview(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Stammdaten"
        title="Einstellungen"
        description="Unternehmensdaten, Standardwerte und Arbeitszeitmodelle werden in einer zusammenhängenden Konfigurationsfläche gepflegt."
      />
      <SettingsAdminForm settings={settings} />

      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[color:var(--color-text)]">
            Arbeitszeitmodelle
          </h2>
          <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">
            Wochenziele und Tagesverteilungen bleiben Teil der Einstellungen und werden nicht in einer separaten
            Verwaltungsseite versteckt.
          </p>
        </div>

        <DialogLauncher
          buttonLabel="Neu anlegen"
          title="Arbeitszeitmodell anlegen"
          description="Wochenziel und Tagesverteilung werden als Dezimalstunden gepflegt."
        >
          <WorkScheduleCreateForm />
        </DialogLauncher>

        <Panel className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[color:var(--color-panel-soft)] text-[color:var(--color-text-muted)]">
                <tr>
                  <th className="px-5 py-4 font-medium">Modell</th>
                  <th className="px-5 py-4 font-medium">Wochenziel</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="border-t border-[color:var(--color-border-soft)] align-top">
                    <td className="px-5 py-4 font-medium text-[color:var(--color-text)]">{schedule.name}</td>
                    <td className="px-5 py-4 tabular-nums text-[color:var(--color-text-soft)]">
                      {formatMinutesCompact(schedule.weekly_target_minutes)} Std.
                    </td>
                    <td className="px-5 py-4">
                      <StatusChip
                        label={schedule.is_active ? "Aktiv" : "Inaktiv"}
                        tone={schedule.is_active ? "success" : "neutral"}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <WorkScheduleRowActions schedule={schedule} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
