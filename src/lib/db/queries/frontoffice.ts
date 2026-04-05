import "server-only";

import { assertEmployeeIsActive, assertHasEmployee, assertTeamLeadOrAdmin } from "@/src/lib/auth/assertions";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";
import { getPendingApprovalsForMyScope } from "@/src/lib/db/queries/dashboard";
import { getStateLabel } from "@/src/lib/presentation/germany";
import { getManagedEmployeeIds } from "@/src/lib/security/scope";
import { getTodayDateKey } from "@/src/lib/presentation/format";

function hasApprovalId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function getProjectOptionsForEmployee() {
  await assertEmployeeIsActive();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("projects")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getMyCorrectionOverview() {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const admin = createSupabaseAdminClient();

  const [{ data: entries, error: entriesError }, { data: requests, error: requestsError }] =
    await Promise.all([
      admin
        .from("time_entries")
        .select("*, time_entry_breaks(*)")
        .eq("employee_id", employee.id)
        .or("locked_at.not.is.null,approval_status.eq.approved,status.eq.approved")
        .order("entry_date", { ascending: false })
        .limit(20),
      admin
        .from("time_entry_change_requests")
        .select("*, time_entries!inner(entry_date, started_at, ended_at, project_id, comment, projects(name, code))")
        .eq("requested_by_employee_id", employee.id)
        .order("created_at", { ascending: false }),
    ]);

  if (entriesError || requestsError) {
    throw new Error(entriesError?.message ?? requestsError?.message ?? "Korrekturen konnten nicht geladen werden");
  }

  return {
    eligibleEntries: entries,
    requests,
  };
}

export async function getAdminEmployeesOverview() {
  await assertTeamLeadOrAdmin();
  const admin = createSupabaseAdminClient();
  const [{ data: employees, error: employeesError }, { data: profiles, error: profilesError }, { data: teams, error: teamsError }, { data: schedules, error: schedulesError }] =
    await Promise.all([
      admin.from("employees").select("*").order("last_name"),
      admin.from("profiles").select("id, role, is_active"),
      admin.from("teams").select("id, name"),
      admin.from("work_schedules").select("id, name"),
    ]);

  if (employeesError || profilesError || teamsError || schedulesError) {
    throw new Error(
      employeesError?.message ??
        profilesError?.message ??
        teamsError?.message ??
        schedulesError?.message ??
        "Mitarbeitende konnten nicht geladen werden"
    );
  }

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const scheduleById = new Map(schedules.map((schedule) => [schedule.id, schedule]));

  return employees.map((employee) => ({
    ...employee,
    profiles: employee.profile_id ? profileById.get(employee.profile_id) ?? null : null,
    team: employee.team_id ? teamById.get(employee.team_id) ?? null : null,
    workSchedule: employee.work_schedule_id ? scheduleById.get(employee.work_schedule_id) ?? null : null,
  }));
}

export async function getAdminTeamsOverview() {
  await assertTeamLeadOrAdmin();
  const admin = createSupabaseAdminClient();
  const [{ data: teams, error: teamsError }, { data: employees, error: employeesError }] = await Promise.all([
    admin.from("teams").select("*").order("name"),
    admin.from("employees").select("id, first_name, last_name, team_id").eq("is_active", true).order("last_name"),
  ]);

  if (teamsError || employeesError) {
    throw new Error(teamsError?.message ?? employeesError?.message ?? "Teams konnten nicht geladen werden");
  }

  return teams.map((team) => ({
    ...team,
    members: employees.filter((employee) => employee.team_id === team.id),
  }));
}

export async function getAdminWorkSchedulesOverview() {
  await assertTeamLeadOrAdmin();
  const admin = createSupabaseAdminClient();
  const [{ data: schedules, error: schedulesError }, { data: days, error: daysError }] = await Promise.all([
    admin.from("work_schedules").select("*").order("name"),
    admin.from("work_schedule_days").select("*").order("weekday"),
  ]);

  if (schedulesError || daysError) {
    throw new Error(schedulesError?.message ?? daysError?.message ?? "Arbeitszeitmodelle konnten nicht geladen werden");
  }

  return schedules.map((schedule) => ({
    ...schedule,
    days: days.filter((day) => day.work_schedule_id === schedule.id),
  }));
}

export async function getAdminProjectsOverview() {
  await assertTeamLeadOrAdmin();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("projects").select("*").order("updated_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getAdminHolidaysOverview() {
  await assertTeamLeadOrAdmin();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("holidays")
    .select("*")
    .order("holiday_date", { ascending: false })
    .order("region_code");

  if (error) {
    throw new Error(error.message);
  }

  const grouped = new Map<
    string,
    {
      holidayDate: string;
      name: string;
      isCompanyObserved: boolean;
      holidayIds: string[];
      regionCodes: string[];
      stateLabels: string[];
    }
  >();

  for (const holiday of data) {
    const key = `${holiday.holiday_date}::${holiday.name}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.holidayIds.push(holiday.id);
      existing.regionCodes.push(holiday.region_code);
      existing.stateLabels.push(getStateLabel(holiday.region_code));
      existing.isCompanyObserved = existing.isCompanyObserved || holiday.is_company_observed;
      continue;
    }

    grouped.set(key, {
      holidayDate: holiday.holiday_date,
      name: holiday.name,
      isCompanyObserved: holiday.is_company_observed,
      holidayIds: [holiday.id],
      regionCodes: [holiday.region_code],
      stateLabels: [getStateLabel(holiday.region_code)],
    });
  }

  return Array.from(grouped.values());
}

export async function getAdminExportsOverview() {
  await assertTeamLeadOrAdmin();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("export_logs")
    .select("*, employees(first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getAdminSelectionOptions() {
  await assertTeamLeadOrAdmin();
  const admin = createSupabaseAdminClient();
  const [{ data: employees, error: employeesError }, { data: teams, error: teamsError }, { data: schedules, error: schedulesError }, { data: projects, error: projectsError }] =
    await Promise.all([
      admin.from("employees").select("id, first_name, last_name, team_id").eq("is_active", true).order("last_name"),
      admin.from("teams").select("id, name").eq("is_active", true).order("name"),
      admin.from("work_schedules").select("id, name").eq("is_active", true).order("name"),
      admin.from("projects").select("id, name").eq("is_active", true).order("name"),
    ]);

  if (employeesError || teamsError || schedulesError || projectsError) {
    throw new Error(
      employeesError?.message ??
        teamsError?.message ??
        schedulesError?.message ??
        projectsError?.message ??
        "Auswahldaten konnten nicht geladen werden"
    );
  }

  return { employees, teams, schedules, projects };
}

export async function getAbsenceCalendarData(input?: {
  year?: number;
  month?: number;
  teamId?: string | null;
}) {
  const context = await assertTeamLeadOrAdmin();
  const admin = createSupabaseAdminClient();
  const year = input?.year ?? new Date().getUTCFullYear();
  const month = input?.month ?? new Date().getUTCMonth() + 1;
  const dateFrom = `${year}-01-01`;
  const dateTo = `${year}-12-31`;

  let employeesQuery = admin
    .from("employees")
    .select("id, first_name, last_name, team_id")
    .eq("is_active", true)
    .order("last_name");

  if (context.profile.role !== "admin") {
    employeesQuery = employeesQuery.eq("team_id", context.employee?.teamId ?? "");
  } else if (input?.teamId) {
    employeesQuery = employeesQuery.eq("team_id", input.teamId);
  }

  const { data: employees, error: employeesError } = await employeesQuery;

  if (employeesError) {
    throw new Error(employeesError.message);
  }

  const employeeIds = employees.map((employee) => employee.id);
  const matchIds = employeeIds.length > 0 ? employeeIds : ["00000000-0000-0000-0000-000000000000"];

  const [{ data: leaveRequests, error: leaveError }, { data: holidays, error: holidaysError }, { data: teams, error: teamsError }] =
    await Promise.all([
      admin
        .from("leave_requests")
        .select("*")
        .in("employee_id", matchIds)
        .in("status", ["pending", "approved"])
        .lte("start_date", dateTo)
        .gte("end_date", dateFrom)
        .order("start_date"),
      admin
        .from("holidays")
        .select("*")
        .gte("holiday_date", dateFrom)
        .lte("holiday_date", dateTo)
        .order("holiday_date"),
      admin.from("teams").select("id, name"),
    ]);

  if (leaveError || holidaysError || teamsError) {
    throw new Error(leaveError?.message ?? holidaysError?.message ?? teamsError?.message ?? "Kalenderdaten konnten nicht geladen werden");
  }

  const teamById = new Map(teams.map((team) => [team.id, team.name]));

  return {
    year,
    month,
    employees: employees.map((employee) => ({
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      teamId: employee.team_id,
      teamName: employee.team_id ? teamById.get(employee.team_id) ?? null : null,
    })),
    leaveRequests,
    holidays,
    teams,
  };
}

export async function getApprovalCenterData() {
  const context = await assertTeamLeadOrAdmin();
  const admin = createSupabaseAdminClient();
  const pending = await getPendingApprovalsForMyScope();
  const employeeIds = await getManagedEmployeeIds(context);
  const matchIds = employeeIds.length > 0 ? employeeIds : ["00000000-0000-0000-0000-000000000000"];
  const today = getTodayDateKey();
  const isOverdue = (value: string | null | undefined) => {
    if (!value) {
      return false;
    }

    return Date.now() - new Date(value).getTime() > 48 * 60 * 60 * 1000;
  };

  const projectIds = Array.from(
    new Set(
      pending.changeRequests
        .map((item) => item.proposed_project_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const [
    { data: employees, error },
    { data: projects, error: projectsError },
  ] = await Promise.all([
    admin
      .from("employees")
      .select("id, first_name, last_name, team_id")
      .in("id", matchIds),
    projectIds.length > 0
      ? admin.from("projects").select("id, name, code").in("id", projectIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (error || projectsError) {
    throw new Error(error?.message ?? projectsError?.message ?? "Freigabedaten konnten nicht geladen werden");
  }

  const employeeById = new Map(
    employees.map((employee) => [
      employee.id,
      {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        teamId: employee.team_id,
      },
    ])
  );
  const projectById = new Map(
    (projects ?? []).map((project) => [
      project.id,
      {
        name: project.name,
        code: project.code,
      },
    ])
  );

  const normalizeApprovalItem = ({
    kind,
    rawId,
    employeeId,
    dateLabel,
    age,
    payload,
  }: {
    kind: "time" | "leave" | "correction";
    rawId: unknown;
    employeeId: string | null | undefined;
    dateLabel?: string | null;
    age?: string | null;
    payload: Record<string, unknown>;
  }) => ({
    kind,
    id: hasApprovalId(rawId) ? rawId : null,
    employee: employeeId ? employeeById.get(employeeId) : undefined,
    dateLabel: dateLabel ?? null,
    age: age ?? null,
    payload,
    issue: hasApprovalId(rawId)
      ? null
      : "Für diesen Vorgang fehlt eine gültige Kennung. Bitte die Datengrundlage prüfen.",
  });

  const urgentToday = [
    ...pending.timeEntries
      .filter((item) => item.entry_date === today)
      .map((item) =>
        normalizeApprovalItem({
          kind: "time",
          rawId: item.id,
          employeeId: item.employee_id,
          dateLabel: item.entry_date,
          age: item.submitted_at ?? item.created_at ?? item.updated_at ?? null,
          payload: item,
        })
      ),
    ...pending.leaveRequests
      .filter((item) => item.start_date <= today && item.end_date >= today)
      .map((item) =>
        normalizeApprovalItem({
          kind: "leave",
          rawId: item.id,
          employeeId: item.employee_id,
          dateLabel: `${item.start_date}__${item.end_date}`,
          age: item.requested_at ?? item.created_at ?? item.updated_at ?? null,
          payload: item,
        })
      ),
  ];

  const overdue = [
    ...pending.timeEntries
      .filter((item) => item.entry_date !== today && isOverdue(item.submitted_at ?? item.created_at ?? item.updated_at))
      .map((item) =>
        normalizeApprovalItem({
          kind: "time",
          rawId: item.id,
          employeeId: item.employee_id,
          dateLabel: item.entry_date,
          age: item.submitted_at ?? item.created_at ?? item.updated_at ?? null,
          payload: item,
        })
      ),
    ...pending.leaveRequests
      .filter(
        (item) =>
          !(item.start_date <= today && item.end_date >= today) &&
          isOverdue(item.requested_at ?? item.created_at ?? item.updated_at)
      )
      .map((item) =>
        normalizeApprovalItem({
          kind: "leave",
          rawId: item.id,
          employeeId: item.employee_id,
          dateLabel: `${item.start_date}__${item.end_date}`,
          age: item.requested_at ?? item.created_at ?? item.updated_at ?? null,
          payload: item,
        })
      ),
  ];

  const corrections = pending.changeRequests.map((item) =>
    normalizeApprovalItem({
      kind: "correction",
      rawId: item.id,
      employeeId: Array.isArray(item.time_entries)
        ? item.time_entries[0]?.employee_id
        : item.time_entries?.employee_id,
      dateLabel: Array.isArray(item.time_entries) ? item.time_entries[0]?.entry_date ?? null : null,
      age: item.created_at ?? item.updated_at ?? null,
      payload: {
        ...item,
        proposed_project_name: item.proposed_project_id
          ? projectById.get(item.proposed_project_id)?.name ?? null
          : null,
        proposed_project_code: item.proposed_project_id
          ? projectById.get(item.proposed_project_id)?.code ?? null
          : null,
      },
    })
  );

  return {
    urgentToday,
    overdue,
    corrections,
    leave: pending.leaveRequests.map((item) =>
      normalizeApprovalItem({
        kind: "leave",
        rawId: item.id,
        employeeId: item.employee_id,
        dateLabel: `${item.start_date}__${item.end_date}`,
        age: item.requested_at ?? item.created_at ?? item.updated_at ?? null,
        payload: item,
      })
    ).filter((item) => {
      const [startDate, endDate] = (item.dateLabel ?? "").split("__");
      const activeToday = startDate <= today && endDate >= today;
      return !activeToday && !isOverdue(item.age);
    }),
    time: pending.timeEntries.map((item) =>
      normalizeApprovalItem({
        kind: "time",
        rawId: item.id,
        employeeId: item.employee_id,
        dateLabel: item.entry_date,
        age: item.submitted_at ?? item.created_at ?? item.updated_at ?? null,
        payload: item,
      })
    ).filter((item) => item.dateLabel !== today && !isOverdue(item.age)),
  };
}
