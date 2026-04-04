"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  archiveProject,
  archiveTeam,
  assignTeamLead,
  createEmployee,
  createHoliday,
  createProject,
  createTeam,
  createWorkSchedule,
  deleteHoliday,
  deactivateEmployee,
  updateCompanySettings,
  updateEmployee,
  updateHoliday,
  updateProject,
  updateTeam,
  updateWorkSchedule,
} from "@/app/actions/admin";
import { Button } from "@/src/components/shared/Button";
import { FormMessage } from "@/src/components/shared/FormMessage";
import { Modal } from "@/src/components/shared/Modal";
import { Panel } from "@/src/components/shared/Panel";
import { toGermanErrorMessage } from "@/src/lib/forms/errors";
import { ALL_GERMAN_STATE_CODES, GERMAN_STATE_OPTIONS } from "@/src/lib/presentation/germany";
import { minutesToInputValue, parseHoursAndMinutes } from "@/src/lib/presentation/format";
import { isPostgresUuidLike } from "@/src/lib/validations/common";

type TeamOption = { id: string; name: string };
type ScheduleOption = { id: string; name: string };
type EmployeeOption = { id: string; first_name: string; last_name: string; team_id: string | null };
type EmployeeProfile = { role?: string } | Array<{ role?: string }> | null;
type EmployeeAdminRow = {
  id: string;
  first_name: string;
  last_name: string;
  team_id: string | null;
  work_schedule_id: string | null;
  profiles?: EmployeeProfile;
};
type TeamAdminRow = {
  id: string;
  name: string;
  is_active?: boolean;
  team_lead_employee_id: string | null;
};
type WorkScheduleDayRow = {
  weekday: number;
  is_workday: boolean;
  target_minutes: number;
};
type WorkScheduleAdminRow = {
  id: string;
  name: string;
  weekly_target_minutes: number;
  is_active?: boolean;
  days: WorkScheduleDayRow[];
};
type ProjectAdminRow = {
  id: string;
  name: string;
  code: string | null;
  description?: string | null;
  is_active: boolean;
};
type HolidayGroupRow = {
  holidayDate: string;
  name: string;
  isCompanyObserved: boolean;
  holidayIds: string[];
  regionCodes: string[];
  stateLabels: string[];
};
type SettingsRow = {
  company_name: string | null;
  timezone: string | null;
  holiday_region_code: string | null;
  default_daily_target_minutes: number | null;
  default_weekly_target_minutes: number | null;
  default_annual_leave_days: number | null;
  carry_over_enabled: boolean | null;
};

function weekdayLabel(weekday: number) {
  return ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][weekday - 1] ?? `Tag ${weekday}`;
}

function parseTimeInputOrThrow(value: string, label: string) {
  const parsed = parseHoursAndMinutes(value);
  if (parsed === null) {
    throw new Error(`${label} bitte als Dezimalstunden eingeben, z. B. 3,50.`);
  }
  return parsed;
}

function LabeledField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-[color:var(--color-text)]">{label}</span>
      {children}
      {hint ? <span className="block text-xs leading-5 text-[color:var(--color-text-muted)]">{hint}</span> : null}
    </label>
  );
}

function StatusToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-[color:var(--color-text-soft)]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function WorkScheduleDaysEditor({
  days,
  setDays,
}: {
  days: Array<{ weekday: number; isWorkday: boolean; targetMinutes: number; inputValue: string }>;
  setDays: Dispatch<SetStateAction<Array<{ weekday: number; isWorkday: boolean; targetMinutes: number; inputValue: string }>>>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {days.map((day, index) => (
        <div key={day.weekday} className="rounded-2xl border border-[color:var(--color-border-soft)] bg-white p-3 text-sm">
          <p className="font-semibold text-[color:var(--color-text)]">{weekdayLabel(day.weekday)}</p>
          <label className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={day.isWorkday}
              onChange={(event) =>
                setDays((current) =>
                  current.map((item, currentIndex) =>
                    currentIndex === index ? { ...item, isWorkday: event.target.checked } : item
                  )
                )
              }
            />
            Arbeitstag
          </label>
          <input
            className="mt-3 w-full rounded-xl border border-[color:var(--color-border-strong)] px-3 py-2 text-sm"
            value={day.inputValue}
            onChange={(event) =>
              setDays((current) =>
                current.map((item, currentIndex) => {
                  if (currentIndex !== index) {
                    return item;
                  }
                  return { ...item, inputValue: event.target.value };
                })
              )
            }
            onBlur={() =>
              setDays((current) =>
                current.map((item, currentIndex) => {
                  if (currentIndex !== index) {
                    return item;
                  }
                  const parsed = parseHoursAndMinutes(item.inputValue);
                  if (parsed === null) {
                    return item;
                  }
                  return { ...item, targetMinutes: parsed, inputValue: minutesToInputValue(parsed) };
                })
              )
            }
          />
        </div>
      ))}
    </div>
  );
}

function GermanStateSelector({
  selectedStates,
  setSelectedStates,
}: {
  selectedStates: string[];
  setSelectedStates: Dispatch<SetStateAction<string[]>>;
}) {
  function toggleState(code: string) {
    setSelectedStates((current) =>
      current.includes(code) ? current.filter((entry) => entry !== code) : [...current, code]
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[color:var(--color-text)]">Bundesländer</p>
        <button
          type="button"
          className="text-sm font-semibold text-[color:var(--color-sidebar)]"
          onClick={() =>
            setSelectedStates((current) =>
              current.length === ALL_GERMAN_STATE_CODES.length ? [] : [...ALL_GERMAN_STATE_CODES]
            )
          }
        >
          {selectedStates.length === ALL_GERMAN_STATE_CODES.length ? "Alle abwählen" : "Alle Bundesländer"}
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {GERMAN_STATE_OPTIONS.map((state) => (
          <label
            key={state.code}
            className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-border-soft)] bg-white px-4 py-3 text-sm text-[color:var(--color-text-soft)]"
          >
            <input
              type="checkbox"
              checked={selectedStates.includes(state.code)}
              onChange={() => toggleState(state.code)}
            />
            {state.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export function EmployeeAdminForm({
  teams,
  schedules,
}: {
  teams: TeamOption[];
  schedules: ScheduleOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    role: "employee",
    firstName: "",
    lastName: "",
    teamId: "",
    workScheduleId: "",
    employmentStartDate: new Date().toISOString().slice(0, 10),
  });

  return (
    <Panel className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.03em]">Mitarbeitende anlegen</h2>
        <p className="text-sm leading-6 text-[color:var(--color-text-soft)]">
          Neue Personen werden per E-Mail eingeladen und sofort mit Rolle, Team und Arbeitszeitmodell verknüpft.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <LabeledField label="E-Mail-Adresse" hint="Über diese Adresse wird der Zugang eingeladen.">
          <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" placeholder="name@firma.de" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
        </LabeledField>
        <LabeledField label="Rolle">
          <select className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
            <option value="employee">Mitarbeitende</option>
            <option value="team_lead">Teamleitung</option>
            <option value="admin">Admin</option>
          </select>
        </LabeledField>
        <LabeledField label="Vorname">
          <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
        </LabeledField>
        <LabeledField label="Nachname">
          <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
        </LabeledField>
        <LabeledField label="Team">
          <select className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.teamId} onChange={(event) => setForm((current) => ({ ...current, teamId: event.target.value }))}>
            <option value="">Kein Team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </LabeledField>
        <LabeledField label="Arbeitszeitmodell">
          <select className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.workScheduleId} onChange={(event) => setForm((current) => ({ ...current, workScheduleId: event.target.value }))}>
            <option value="">Kein Arbeitszeitmodell</option>
            {schedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>{schedule.name}</option>
            ))}
          </select>
        </LabeledField>
        <LabeledField label="Beschäftigungsbeginn">
          <input type="date" className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.employmentStartDate} onChange={(event) => setForm((current) => ({ ...current, employmentStartDate: event.target.value }))} />
        </LabeledField>
      </div>
      <Button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              setMessage(null);
              setSuccess(null);
              await createEmployee({
                email: form.email,
                role: form.role as "employee" | "team_lead" | "admin",
                firstName: form.firstName,
                lastName: form.lastName,
                teamId: form.teamId || null,
                workScheduleId: form.workScheduleId || null,
                employmentStartDate: form.employmentStartDate,
              });
              setSuccess("Mitarbeitende Person wurde angelegt.");
              router.refresh();
            } catch (error) {
              setMessage(toGermanErrorMessage(error));
            }
          })
        }
      >
        {isPending ? "Wird angelegt..." : "Mitarbeitende anlegen"}
      </Button>
      <FormMessage message={message} />
      <FormMessage message={success} tone="success" />
    </Panel>
  );
}

export function EmployeeRowActions({
  employee,
  teams,
  schedules,
}: {
  employee: EmployeeAdminRow;
  teams: TeamOption[];
  schedules: ScheduleOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: employee.first_name,
    lastName: employee.last_name,
    teamId: employee.team_id ?? "",
    workScheduleId: employee.work_schedule_id ?? "",
    role: Array.isArray(employee.profiles) ? employee.profiles[0]?.role : employee.profiles?.role ?? "employee",
  });

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Bearbeiten
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${employee.first_name} ${employee.last_name}`}
        description="Rolle, Team und Arbeitszeitmodell werden zentral gepflegt."
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Vorname">
              <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
            </LabeledField>
            <LabeledField label="Nachname">
              <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
            </LabeledField>
            <LabeledField label="Rolle">
              <select className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                <option value="employee">Mitarbeitende</option>
                <option value="team_lead">Teamleitung</option>
                <option value="admin">Admin</option>
              </select>
            </LabeledField>
            <LabeledField label="Team">
              <select className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm" value={form.teamId} onChange={(event) => setForm((current) => ({ ...current, teamId: event.target.value }))}>
                <option value="">Kein Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </LabeledField>
            <LabeledField label="Arbeitszeitmodell">
              <select className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm" value={form.workScheduleId} onChange={(event) => setForm((current) => ({ ...current, workScheduleId: event.target.value }))}>
                <option value="">Kein Arbeitszeitmodell</option>
                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>{schedule.name}</option>
                ))}
              </select>
            </LabeledField>
          </div>

          <div className="flex flex-wrap justify-between gap-3 border-t border-[color:var(--color-border-soft)] pt-4">
            <Button
              type="button"
              variant="danger"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    setMessage(null);
                    setSuccess(null);
                    await deactivateEmployee(employee.id, "Deaktiviert über Verwaltungsoberfläche");
                    setSuccess("Mitarbeitende Person wurde deaktiviert.");
                    router.refresh();
                    setOpen(false);
                  } catch (error) {
                    setMessage(toGermanErrorMessage(error));
                  }
                })
              }
            >
              Deaktivieren
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    setMessage(null);
                    setSuccess(null);
                    await updateEmployee({
                      employeeId: employee.id,
                      firstName: form.firstName,
                      lastName: form.lastName,
                      teamId: form.teamId || null,
                      workScheduleId: form.workScheduleId || null,
                      role: form.role as "employee" | "team_lead" | "admin",
                    });
                    setSuccess("Mitarbeitende Person wurde aktualisiert.");
                    router.refresh();
                    setOpen(false);
                  } catch (error) {
                    setMessage(toGermanErrorMessage(error));
                  }
                })
              }
            >
              Änderungen speichern
            </Button>
          </div>
          <FormMessage message={message} />
          <FormMessage message={success} tone="success" />
        </div>
      </Modal>
    </>
  );
}

export function TeamAdminForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Panel className="space-y-4">
      <h2 className="text-xl font-semibold tracking-[-0.03em]">Team anlegen</h2>
      <LabeledField label="Teamname">
        <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" placeholder="z. B. Team Nord" value={name} onChange={(event) => setName(event.target.value)} />
      </LabeledField>
      <Button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              setMessage(null);
              setSuccess(null);
              await createTeam({ name });
              setSuccess("Team wurde angelegt.");
              router.refresh();
            } catch (error) {
              setMessage(toGermanErrorMessage(error));
            }
          })
        }
      >
        Team anlegen
      </Button>
      <FormMessage message={message} />
      <FormMessage message={success} tone="success" />
    </Panel>
  );
}

export function TeamRowActions({
  team,
  employees,
}: {
  team: TeamAdminRow;
  employees: EmployeeOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(team.name);
  const [leadId, setLeadId] = useState(team.team_lead_employee_id ?? "");
  const [isActive, setIsActive] = useState(team.is_active ?? true);
  const [memberIds, setMemberIds] = useState(
    employees.filter((employee) => employee.team_id === team.id).map((employee) => employee.id)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const allEmployees = employees.slice().sort((left, right) =>
    `${left.last_name} ${left.first_name}`.localeCompare(`${right.last_name} ${right.first_name}`, "de")
  );

  function toggleMember(employeeId: string) {
    setMemberIds((current) =>
      current.includes(employeeId) ? current.filter((item) => item !== employeeId) : [...current, employeeId]
    );
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Bearbeiten
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={team.name}
        description="Teamleitung, Mitglieder und Aktivstatus werden gemeinsam gepflegt."
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Teamname">
              <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm" value={name} onChange={(event) => setName(event.target.value)} />
            </LabeledField>
            <LabeledField label="Teamleitung">
              <select className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm" value={leadId} onChange={(event) => setLeadId(event.target.value)}>
                <option value="">Keine Teamleitung</option>
                {allEmployees
                  .filter((employee) => memberIds.includes(employee.id))
                  .map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name}
                    </option>
                  ))}
              </select>
            </LabeledField>
          </div>

          <StatusToggle checked={isActive} label="Team aktiv" onChange={setIsActive} />

          <div className="space-y-3">
            <p className="text-sm font-medium text-[color:var(--color-text)]">Mitglieder zuordnen</p>
            <div className="grid max-h-[320px] gap-2 overflow-auto rounded-[1.5rem] border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel-soft)] p-3 md:grid-cols-2">
              {allEmployees.map((employee) => (
                <label
                  key={employee.id}
                  className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-border-soft)] bg-white px-4 py-3 text-sm text-[color:var(--color-text-soft)]"
                >
                  <input
                    type="checkbox"
                    checked={memberIds.includes(employee.id)}
                    onChange={() => toggleMember(employee.id)}
                  />
                  <span>
                    {employee.first_name} {employee.last_name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-3 border-t border-[color:var(--color-border-soft)] pt-4">
            <Button
              type="button"
              variant="danger"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    setMessage(null);
                    setSuccess(null);
                    await archiveTeam({ teamId: team.id });
                    setSuccess("Team wurde archiviert.");
                    router.refresh();
                    setOpen(false);
                  } catch (error) {
                    setMessage(toGermanErrorMessage(error));
                  }
                })
              }
            >
              Archivieren
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    setMessage(null);
                    setSuccess(null);
                    await updateTeam({ teamId: team.id, name, isActive, memberIds });
                    await assignTeamLead({ teamId: team.id, teamLeadEmployeeId: leadId || null });
                    setSuccess("Team wurde aktualisiert.");
                    router.refresh();
                    setOpen(false);
                  } catch (error) {
                    setMessage(toGermanErrorMessage(error));
                  }
                })
              }
            >
              Änderungen speichern
            </Button>
          </div>
          <FormMessage message={message} />
          <FormMessage message={success} tone="success" />
        </div>
      </Modal>
    </>
  );
}

function defaultDays() {
  return [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
    weekday,
    isWorkday: weekday <= 5,
    targetMinutes: weekday <= 5 ? 480 : 0,
    inputValue: minutesToInputValue(weekday <= 5 ? 480 : 0),
  }));
}

export function WorkScheduleCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [weeklyTargetMinutes, setWeeklyTargetMinutes] = useState("40,00");
  const [isActive, setIsActive] = useState(true);
  const [days, setDays] = useState(defaultDays());

  return (
    <Panel className="space-y-4">
      <h2 className="text-xl font-semibold tracking-[-0.03em]">Arbeitszeitmodell anlegen</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <LabeledField label="Name des Modells">
          <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" placeholder="Standard 40h" value={name} onChange={(event) => setName(event.target.value)} />
        </LabeledField>
        <LabeledField label="Wochenziel" hint="Bitte als Dezimalstunden eingeben, z. B. 40,00.">
          <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" placeholder="40,00" value={weeklyTargetMinutes} onChange={(event) => setWeeklyTargetMinutes(event.target.value)} />
        </LabeledField>
      </div>
      <StatusToggle checked={isActive} label="Modell aktiv" onChange={setIsActive} />
      <WorkScheduleDaysEditor days={days} setDays={setDays} />
      <Button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              setMessage(null);
              setSuccess(null);
              await createWorkSchedule({
                name,
                weeklyTargetMinutes: parseTimeInputOrThrow(weeklyTargetMinutes, "Wochenziel"),
                days: days.map((day) => ({
                  weekday: day.weekday,
                  isWorkday: day.isWorkday,
                  targetMinutes: parseTimeInputOrThrow(day.inputValue, `Sollzeit ${weekdayLabel(day.weekday)}`),
                })),
                isActive,
              });
              setSuccess("Arbeitszeitmodell wurde angelegt.");
              router.refresh();
            } catch (error) {
              setMessage(toGermanErrorMessage(error));
            }
          })
        }
      >
        Modell anlegen
      </Button>
      <FormMessage message={message} />
      <FormMessage message={success} tone="success" />
    </Panel>
  );
}

export function WorkScheduleRowActions({ schedule }: { schedule: WorkScheduleAdminRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState(schedule.name);
  const [weeklyTargetMinutes, setWeeklyTargetMinutes] = useState(minutesToInputValue(schedule.weekly_target_minutes));
  const [isActive, setIsActive] = useState(schedule.is_active ?? true);
  const [days, setDays] = useState(
    [1, 2, 3, 4, 5, 6, 7].map((weekday) => {
      const existing = schedule.days.find((day) => day.weekday === weekday);
      return {
        weekday,
        isWorkday: existing?.is_workday ?? false,
        targetMinutes: existing?.target_minutes ?? 0,
        inputValue: minutesToInputValue(existing?.target_minutes ?? 0),
      };
    })
  );

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Bearbeiten
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={schedule.name}
        description="Wochenziel und Tagesverteilung werden als Dezimalstunden gepflegt."
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Name des Modells">
              <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm" value={name} onChange={(event) => setName(event.target.value)} />
            </LabeledField>
            <LabeledField label="Wochenziel" hint="Format 40,00">
              <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm" value={weeklyTargetMinutes} onChange={(event) => setWeeklyTargetMinutes(event.target.value)} />
            </LabeledField>
          </div>
          <StatusToggle checked={isActive} label="Modell aktiv" onChange={setIsActive} />
          <WorkScheduleDaysEditor days={days} setDays={setDays} />
          <div className="flex justify-end border-t border-[color:var(--color-border-soft)] pt-4">
            <Button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    setMessage(null);
                    setSuccess(null);
                    await updateWorkSchedule({
                      workScheduleId: schedule.id,
                      name,
                      weeklyTargetMinutes: parseTimeInputOrThrow(weeklyTargetMinutes, "Wochenziel"),
                      days: days.map((day) => ({
                        weekday: day.weekday,
                        isWorkday: day.isWorkday,
                        targetMinutes: parseTimeInputOrThrow(day.inputValue, `Sollzeit ${weekdayLabel(day.weekday)}`),
                      })),
                      isActive,
                    });
                    setSuccess("Arbeitszeitmodell wurde aktualisiert.");
                    router.refresh();
                    setOpen(false);
                  } catch (error) {
                    setMessage(toGermanErrorMessage(error));
                  }
                })
              }
            >
              Änderungen speichern
            </Button>
          </div>
          <FormMessage message={message} />
          <FormMessage message={success} tone="success" />
        </div>
      </Modal>
    </>
  );
}

export function ProjectAdminForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <Panel className="space-y-4">
      <h2 className="text-xl font-semibold tracking-[-0.03em]">Projekt anlegen</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <LabeledField label="Projektname / Titel">
          <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" placeholder="Umbau Hauptfiliale" value={name} onChange={(event) => setName(event.target.value)} />
        </LabeledField>
        <LabeledField label="Projektnummer">
          <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" placeholder="PR-2026-014" value={code} onChange={(event) => setCode(event.target.value)} />
        </LabeledField>
      </div>
      <LabeledField label="Beschreibung">
        <textarea className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
      </LabeledField>
      <Button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              setMessage(null);
              setSuccess(null);
              await createProject({ name, code: code || null, description: description || null });
              setSuccess("Projekt wurde angelegt.");
              router.refresh();
            } catch (error) {
              setMessage(toGermanErrorMessage(error));
            }
          })
        }
      >
        Projekt anlegen
      </Button>
      <FormMessage message={message} />
      <FormMessage message={success} tone="success" />
    </Panel>
  );
}

export function ProjectRowActions({ project }: { project: ProjectAdminRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [code, setCode] = useState(project.code ?? "");
  const [description, setDescription] = useState(project.description ?? "");
  const [isActive, setIsActive] = useState(Boolean(project.is_active));
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Bearbeiten
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={project.name}
        description="Projektstammdaten werden im Modal gepflegt und nicht direkt in der Tabelle."
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Projektname / Titel">
              <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm" value={name} onChange={(event) => setName(event.target.value)} />
            </LabeledField>
            <LabeledField label="Projektnummer">
              <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm" value={code} onChange={(event) => setCode(event.target.value)} />
            </LabeledField>
          </div>
          <LabeledField label="Beschreibung">
            <textarea className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-white px-4 py-3 text-sm" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </LabeledField>
          <StatusToggle checked={isActive} label="Projekt aktiv" onChange={setIsActive} />
          <div className="flex flex-wrap justify-between gap-3 border-t border-[color:var(--color-border-soft)] pt-4">
            <Button
              type="button"
              variant="danger"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    setMessage(null);
                    setSuccess(null);
                    if (!isPostgresUuidLike(project.id)) {
                      throw new Error("Für dieses Projekt liegt keine gültige Kennung vor.");
                    }
                    await archiveProject({ projectId: project.id });
                    setSuccess("Projekt wurde archiviert.");
                    router.refresh();
                    setOpen(false);
                  } catch (error) {
                    setMessage(toGermanErrorMessage(error));
                  }
                })
              }
            >
              Archivieren
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    setMessage(null);
                    setSuccess(null);
                    if (!isPostgresUuidLike(project.id)) {
                      throw new Error("Für dieses Projekt liegt keine gültige Kennung vor.");
                    }
                    await updateProject({
                      projectId: project.id,
                      name,
                      code: code || null,
                      description: description || null,
                      isActive,
                    });
                    setSuccess("Projekt wurde aktualisiert.");
                    router.refresh();
                    setOpen(false);
                  } catch (error) {
                    setMessage(toGermanErrorMessage(error));
                  }
                })
              }
            >
              Änderungen speichern
            </Button>
          </div>
          <FormMessage message={message} />
          <FormMessage message={success} tone="success" />
        </div>
      </Modal>
    </>
  );
}

export function HolidayAdminForm({ holiday }: { holiday?: HolidayGroupRow }) {
  const router = useRouter();
  const [holidayDate, setHolidayDate] = useState(holiday?.holidayDate ?? "");
  const [name, setName] = useState(holiday?.name ?? "");
  const [selectedStates, setSelectedStates] = useState<string[]>(holiday?.regionCodes ?? ["DE-NI"]);
  const [isCompanyObserved, setIsCompanyObserved] = useState(holiday?.isCompanyObserved ?? true);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Panel className="space-y-4">
      <h2 className="text-xl font-semibold tracking-[-0.03em]">
        {holiday ? "Feiertag bearbeiten" : "Feiertag ergänzen"}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <LabeledField label="Datum">
          <input type="date" className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={holidayDate} onChange={(event) => setHolidayDate(event.target.value)} />
        </LabeledField>
        <LabeledField label="Bezeichnung">
          <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={name} onChange={(event) => setName(event.target.value)} />
        </LabeledField>
      </div>

      <GermanStateSelector selectedStates={selectedStates} setSelectedStates={setSelectedStates} />

      <StatusToggle checked={isCompanyObserved} label="Im Unternehmen beobachtet" onChange={setIsCompanyObserved} />

      <Button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              setMessage(null);
              setSuccess(null);
              const payload = {
                holidayDate,
                name,
                regionCodes: selectedStates.length === 0 ? [...ALL_GERMAN_STATE_CODES] : selectedStates,
                isCompanyObserved,
              };

              if (holiday) {
                await updateHoliday({ ...payload, holidayIds: holiday.holidayIds });
                setSuccess("Feiertag wurde aktualisiert.");
              } else {
                await createHoliday(payload);
                setSuccess("Feiertag wurde angelegt.");
              }
              router.refresh();
            } catch (error) {
              setMessage(toGermanErrorMessage(error));
            }
          })
        }
      >
        {holiday ? "Feiertag speichern" : "Feiertag anlegen"}
      </Button>
      <FormMessage message={message} />
      <FormMessage message={success} tone="success" />
    </Panel>
  );
}

export function HolidayRowActions({ holiday }: { holiday: HolidayGroupRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Bearbeiten
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={holiday.name}
        description={holiday.stateLabels.length === 16 ? "Alle Bundesländer" : holiday.stateLabels.join(", ")}
      >
        <div className="space-y-4">
          <HolidayAdminForm holiday={holiday} />
          <div className="flex justify-start border-t border-[color:var(--color-border-soft)] pt-4">
            <Button
              type="button"
              variant="danger"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    setMessage(null);
                    setSuccess(null);
                    await deleteHoliday({ holidayIds: holiday.holidayIds });
                    setSuccess("Feiertag wurde gelöscht.");
                    router.refresh();
                    setOpen(false);
                  } catch (error) {
                    setMessage(toGermanErrorMessage(error));
                  }
                })
              }
            >
              Löschen
            </Button>
          </div>
          <FormMessage message={message} />
          <FormMessage message={success} tone="success" />
        </div>
      </Modal>
    </>
  );
}

export function SettingsAdminForm({ settings }: { settings: SettingsRow }) {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: settings.company_name ?? "",
    timezone: settings.timezone ?? "Europe/Berlin",
    holidayRegionCode: settings.holiday_region_code ?? "DE-NI",
    defaultDailyTargetMinutes: minutesToInputValue(settings.default_daily_target_minutes ?? 480),
    defaultWeeklyTargetMinutes: minutesToInputValue(settings.default_weekly_target_minutes ?? 2400),
    defaultAnnualLeaveDays: String(settings.default_annual_leave_days ?? 30),
    carryOverEnabled: Boolean(settings.carry_over_enabled),
  });
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Panel className="space-y-4">
      <h2 className="text-xl font-semibold tracking-[-0.03em]">Unternehmenseinstellungen</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <LabeledField label="Firmenname">
          <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} />
        </LabeledField>
        <LabeledField label="Zeitzone">
          <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} />
        </LabeledField>
        <LabeledField label="Standard-Feiertagsregion" hint="Technischer Default für Sollzeit und Feiertagsbezug.">
          <select className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.holidayRegionCode} onChange={(event) => setForm((current) => ({ ...current, holidayRegionCode: event.target.value }))}>
            {GERMAN_STATE_OPTIONS.map((state) => (
              <option key={state.code} value={state.code}>{state.label}</option>
            ))}
          </select>
        </LabeledField>
        <LabeledField label="Standard-Sollzeit pro Tag" hint="Bitte als Dezimalstunden eingeben, z. B. 8,00.">
          <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.defaultDailyTargetMinutes} onChange={(event) => setForm((current) => ({ ...current, defaultDailyTargetMinutes: event.target.value }))} />
        </LabeledField>
        <LabeledField label="Standard-Sollzeit pro Woche" hint="Bitte als Dezimalstunden eingeben, z. B. 40,00.">
          <input className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.defaultWeeklyTargetMinutes} onChange={(event) => setForm((current) => ({ ...current, defaultWeeklyTargetMinutes: event.target.value }))} />
        </LabeledField>
        <LabeledField label="Standard-Urlaubstage pro Jahr">
          <input type="number" className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.defaultAnnualLeaveDays} onChange={(event) => setForm((current) => ({ ...current, defaultAnnualLeaveDays: event.target.value }))} />
        </LabeledField>
      </div>
      <StatusToggle checked={form.carryOverEnabled} label="Übertrag ins Folgejahr erlauben" onChange={(checked) => setForm((current) => ({ ...current, carryOverEnabled: checked }))} />
      <Button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              setMessage(null);
              setSuccess(null);
              await updateCompanySettings({
                companyName: form.companyName,
                timezone: form.timezone,
                holidayRegionCode: form.holidayRegionCode,
                defaultDailyTargetMinutes: parseTimeInputOrThrow(form.defaultDailyTargetMinutes, "Standard-Sollzeit pro Tag"),
                defaultWeeklyTargetMinutes: parseTimeInputOrThrow(form.defaultWeeklyTargetMinutes, "Standard-Sollzeit pro Woche"),
                defaultAnnualLeaveDays: Number(form.defaultAnnualLeaveDays),
                carryOverEnabled: form.carryOverEnabled,
              });
              setSuccess("Unternehmenseinstellungen wurden gespeichert.");
              router.refresh();
            } catch (error) {
              setMessage(toGermanErrorMessage(error));
            }
          })
        }
      >
        Einstellungen speichern
      </Button>
      <FormMessage message={message} />
      <FormMessage message={success} tone="success" />
    </Panel>
  );
}

export function ExportTriggerForm({
  employees,
  teams,
}: {
  employees: EmployeeOption[];
  teams: TeamOption[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    dateFrom: new Date().toISOString().slice(0, 10),
    dateTo: new Date().toISOString().slice(0, 10),
    employeeId: "",
    teamId: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function runExport(type: "monthly_timesheet" | "absence_report" | "team_overview") {
    setMessage(null);
    setSuccess(null);

    try {
      if (type === "monthly_timesheet" && !form.employeeId) {
        throw new Error("Bitte wählen Sie für den Monatsexport eine mitarbeitende Person aus.");
      }

      const payload = {
        exportType: type,
        dateFrom: form.dateFrom,
        dateTo: form.dateTo,
        employeeId: form.employeeId || null,
        teamId: form.teamId || null,
      };
      const query = new URLSearchParams(
        Object.entries(payload).reduce<Record<string, string>>((accumulator, [key, value]) => {
          if (value) {
            accumulator[key] = value;
          }
          return accumulator;
        }, {})
      );
      window.open(`/api/exports/pdf?${query.toString()}`, "_blank", "noopener,noreferrer");
      setSuccess("PDF-Export wurde gestartet.");
      window.setTimeout(() => router.refresh(), 800);
    } catch (error) {
      setMessage(toGermanErrorMessage(error));
    }
  }

  return (
    <Panel className="space-y-4">
      <h2 className="text-xl font-semibold tracking-[-0.03em]">Export auslösen</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <LabeledField label="Von">
          <input type="date" className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.dateFrom} onChange={(event) => setForm((current) => ({ ...current, dateFrom: event.target.value }))} />
        </LabeledField>
        <LabeledField label="Bis">
          <input type="date" className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.dateTo} onChange={(event) => setForm((current) => ({ ...current, dateTo: event.target.value }))} />
        </LabeledField>
        <LabeledField label="Mitarbeitende">
          <select className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.employeeId} onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))}>
            <option value="">Alle Mitarbeitenden</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name}</option>
            ))}
          </select>
        </LabeledField>
        <LabeledField label="Team">
          <select className="w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-panel-soft)] px-4 py-3 text-sm" value={form.teamId} onChange={(event) => setForm((current) => ({ ...current, teamId: event.target.value }))}>
            <option value="">Alle Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </LabeledField>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={isPending} onClick={() => startTransition(async () => runExport("monthly_timesheet"))}>
          Monatsexport
        </Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => startTransition(async () => runExport("absence_report"))}>
          Abwesenheitsreport
        </Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => startTransition(async () => runExport("team_overview"))}>
          Teamübersicht
        </Button>
      </div>
      <FormMessage message={message} />
      <FormMessage message={success} tone="success" />
    </Panel>
  );
}
