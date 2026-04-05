import "server-only";

import {
  assertEmployeeIsActive,
  assertHasEmployee,
  assertTeamLeadScopeForEmployee,
  assertTeamLeadOrAdmin,
} from "@/src/lib/auth/assertions";
import { computeBreakMinutes, computeWorkedMinutes } from "@/src/lib/domain/time-calculations";
import { getLeaveBalanceSnapshot } from "@/src/lib/domain/leave-balance";
import { getTargetMinutesForEmployeeOnDate } from "@/src/lib/domain/target-time";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  return copy;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function readProjectRelation(
  project:
    | {
        name: string | null;
        code: string | null;
      }
    | {
        name: string | null;
        code: string | null;
      }[]
    | null
    | undefined
) {
  return Array.isArray(project) ? project[0] ?? null : project ?? null;
}

export async function getCompanyContext() {
  await assertEmployeeIsActive();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("company_settings")
    .select("company_name, timezone, holiday_region_code, default_annual_leave_days")
    .eq("id", 1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    companyName: data.company_name,
    timezone: data.timezone,
    holidayRegionCode: data.holiday_region_code,
    defaultAnnualLeaveDays: Number(data.default_annual_leave_days),
  };
}

export async function getCompanySettingsForAdmin() {
  const context = await assertTeamLeadOrAdmin();
  if (context.profile.role !== "admin") {
    throw new Error("Admin access required");
  }
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("company_settings").select("*").eq("id", 1).single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getMyTodayTimeEntry() {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const today = toDateKey(new Date());
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("time_entries")
    .select("*, time_entry_breaks(*), projects(name, code)")
    .eq("employee_id", employee.id)
    .eq("entry_date", today)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const breakMinutes = computeBreakMinutes(data.time_entry_breaks ?? []);
  const workedMinutes = computeWorkedMinutes(data, data.time_entry_breaks ?? []);
  const targetMinutes = await getTargetMinutesForEmployeeOnDate(employee.id, today);

  return {
    ...data,
    computedBreakMinutes: breakMinutes,
    computedWorkedMinutes: workedMinutes,
    targetMinutes,
  };
}

export async function getMyWeekOverview() {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const admin = createSupabaseAdminClient();
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  const { data, error } = await admin
    .from("time_entries")
    .select("*, time_entry_breaks(*), projects(name, code)")
    .eq("employee_id", employee.id)
    .gte("entry_date", toDateKey(weekStart))
    .lte("entry_date", toDateKey(weekEnd))
    .order("entry_date");

  if (error) {
    throw new Error(error.message);
  }

  return Promise.all(
    data.map(async (entry) => ({
      ...entry,
      computedBreakMinutes: computeBreakMinutes(entry.time_entry_breaks ?? []),
      computedWorkedMinutes: computeWorkedMinutes(entry, entry.time_entry_breaks ?? []),
      targetMinutes: await getTargetMinutesForEmployeeOnDate(employee.id, entry.entry_date),
    }))
  );
}

export async function getMyLeaveOverview() {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const admin = createSupabaseAdminClient();
  const year = new Date().getUTCFullYear();
  const balance = await getLeaveBalanceSnapshot(employee.id, year);
  const { data, error } = await admin
    .from("leave_requests")
    .select("*")
    .eq("employee_id", employee.id)
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return {
    balance,
    requests: data,
  };
}

export async function getTeamTodayOverview() {
  const context = await assertTeamLeadOrAdmin();
  const employee = assertHasEmployee(context);
  const admin = createSupabaseAdminClient();
  const today = toDateKey(new Date());

  let employeeQuery = admin
    .from("employees")
    .select("id, first_name, last_name, team_id")
    .eq("is_active", true);

  if (context.profile.role !== "admin") {
    employeeQuery = employeeQuery.eq("team_id", employee.teamId);
  }

  const { data: employees, error: employeeError } = await employeeQuery;
  if (employeeError) {
    throw new Error(employeeError.message);
  }

  const employeeIds = employees.map((row) => row.id);
  const { data: entries, error: entryError } = await admin
    .from("time_entries")
    .select("*, time_entry_breaks(*), projects(name, code)")
    .in("employee_id", employeeIds.length > 0 ? employeeIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("entry_date", today);

  if (entryError) {
    throw new Error(entryError.message);
  }

  const { data: leaveRequests, error: leaveError } = await admin
    .from("leave_requests")
    .select("*")
    .in("employee_id", employeeIds.length > 0 ? employeeIds : ["00000000-0000-0000-0000-000000000000"])
    .lte("start_date", today)
    .gte("end_date", today)
    .in("status", ["pending", "approved"]);

  if (leaveError) {
    throw new Error(leaveError.message);
  }

  return employees.map((teamEmployee) => {
    const entry = entries.find((currentEntry) => currentEntry.employee_id === teamEmployee.id);
    const leave = leaveRequests.find((currentLeave) => currentLeave.employee_id === teamEmployee.id);

    return {
      employee: teamEmployee,
      timeEntry: entry
        ? {
            ...entry,
            computedBreakMinutes: computeBreakMinutes(entry.time_entry_breaks ?? []),
            computedWorkedMinutes: computeWorkedMinutes(entry, entry.time_entry_breaks ?? []),
          }
        : null,
      activeAbsence: leave
        ? {
            ...leave,
            isOperationallyVisible: leave.leave_type === "sick" || leave.status === "approved",
          }
        : null,
    };
  });
}

export async function getPendingApprovalsForMyScope() {
  const context = await assertTeamLeadOrAdmin();
  const employee = assertHasEmployee(context);
  const admin = createSupabaseAdminClient();

  let employeesQuery = admin.from("employees").select("id");
  if (context.profile.role !== "admin") {
    employeesQuery = employeesQuery.eq("team_id", employee.teamId);
  }

  const { data: employees, error: employeesError } = await employeesQuery;
  if (employeesError) {
    throw new Error(employeesError.message);
  }

  const employeeIds = employees.map((row) => row.id);
  const matchIds = employeeIds.length > 0 ? employeeIds : ["00000000-0000-0000-0000-000000000000"];

  const [{ data: timeEntries, error: timeError }, { data: leaveRequests, error: leaveError }, { data: changeRequests, error: changeError }] =
    await Promise.all([
      admin
        .from("time_entries")
        .select("*, time_entry_breaks(*), projects(name, code)")
        .in("employee_id", matchIds)
        .eq("approval_status", "pending"),
      admin.from("leave_requests").select("*").in("employee_id", matchIds).eq("status", "pending"),
      admin
        .from("time_entry_change_requests")
        .select("*, time_entries!inner(employee_id, entry_date, started_at, ended_at, project_id, comment, projects(name, code))")
        .eq("status", "pending"),
    ]);

  if (timeError || leaveError || changeError) {
    throw new Error(timeError?.message ?? leaveError?.message ?? changeError?.message ?? "Unable to load pending approvals");
  }

  const scopedChangeRequests = changeRequests.filter((request) =>
    matchIds.includes(
      Array.isArray(request.time_entries)
        ? request.time_entries[0]?.employee_id
        : request.time_entries?.employee_id
    )
  );

  return {
    timeEntries,
    leaveRequests,
    changeRequests: scopedChangeRequests,
  };
}

export async function getMonthlyEmployeeSummary(employeeId: string, year: number, month: number) {
  await assertTeamLeadScopeForEmployee(employeeId);
  const admin = createSupabaseAdminClient();
  const dateFrom = `${year}-${String(month).padStart(2, "0")}-01`;
  const dateTo = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

  const [{ data: entries, error: timeError }, { data: leaveRequests, error: leaveError }] = await Promise.all([
    admin
      .from("time_entries")
      .select("*, time_entry_breaks(*), projects(name, code), employees!time_entries_employee_id_fkey(team_id)")
      .eq("employee_id", employeeId)
      .gte("entry_date", dateFrom)
      .lte("entry_date", dateTo),
    admin
      .from("leave_requests")
      .select("*")
      .eq("employee_id", employeeId)
      .lte("start_date", dateTo)
      .gte("end_date", dateFrom),
  ]);

  if (timeError || leaveError) {
    throw new Error(timeError?.message ?? leaveError?.message ?? "Unable to load monthly summary");
  }

  const workedMinutes = entries.reduce(
    (total, entry) => total + computeWorkedMinutes(entry, entry.time_entry_breaks ?? []),
    0
  );

  const targetMinutes = await Promise.all(
    entries.map((entry) => getTargetMinutesForEmployeeOnDate(employeeId, entry.entry_date))
  ).then((values) => values.reduce((sum, value) => sum + value, 0));

  return {
    workedMinutes,
    targetMinutes,
    deltaMinutes: workedMinutes - targetMinutes,
    approvedVacationCount: leaveRequests.filter(
      (request) => request.leave_type === "vacation" && request.status === "approved"
    ).length,
    sickCount: leaveRequests.filter((request) => request.leave_type === "sick").length,
    entries,
    leaveRequests,
  };
}

export async function getAdminDashboardSummary() {
  const context = await assertTeamLeadOrAdmin();
  if (context.profile.role !== "admin") {
    throw new Error("Admin access required");
  }

  const admin = createSupabaseAdminClient();
  const today = toDateKey(new Date());

  const [
    { count: activeEmployees },
    { count: pendingTimeEntries },
    { count: pendingLeaveRequests },
    { count: todayEntries },
  ] = await Promise.all([
    admin.from("employees").select("*", { count: "exact", head: true }).eq("is_active", true),
    admin
      .from("time_entries")
      .select("*", { count: "exact", head: true })
      .eq("approval_status", "pending"),
    admin
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    admin.from("time_entries").select("*", { count: "exact", head: true }).eq("entry_date", today),
  ]);

  return {
    activeEmployees: activeEmployees ?? 0,
    pendingTimeEntries: pendingTimeEntries ?? 0,
    pendingLeaveRequests: pendingLeaveRequests ?? 0,
    todayEntries: todayEntries ?? 0,
  };
}

export async function getMonthlyProjectSummary(year: number, month: number, teamId?: string | null) {
  const context = await assertTeamLeadOrAdmin();
  const admin = createSupabaseAdminClient();
  const dateFrom = `${year}-${String(month).padStart(2, "0")}-01`;
  const dateTo = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

  const { data: entries, error } = await admin
    .from("time_entries")
    .select("id, employee_id, entry_date, started_at, ended_at, project_id, time_entry_breaks(*), projects(name, code)")
    .gte("entry_date", dateFrom)
    .lte("entry_date", dateTo);

  if (error) {
    throw new Error(error.message);
  }

  const employeeIds = Array.from(new Set(entries.map((entry) => entry.employee_id)));
  const { data: employees, error: employeeError } = await admin
    .from("employees")
    .select("id, team_id")
    .in("id", employeeIds.length > 0 ? employeeIds : ["00000000-0000-0000-0000-000000000000"]);

  if (employeeError) {
    throw new Error(employeeError.message);
  }

  const teamIdByEmployeeId = new Map(employees.map((employee) => [employee.id, employee.team_id]));

  const scopedEntries = entries.filter((entry) => {
    const entryTeamId = teamIdByEmployeeId.get(entry.employee_id) ?? null;

    if (context.profile.role !== "admin") {
      return entryTeamId === context.employee?.teamId;
    }

    if (teamId) {
      return entryTeamId === teamId;
    }

    return true;
  });

  const projectMap = new Map<
    string,
    {
      projectId: string;
      projectName: string;
      projectCode: string | null;
      workedMinutes: number;
      entryCount: number;
    }
  >();

  for (const entry of scopedEntries) {
    const key = entry.project_id ?? "unassigned";
    const project = readProjectRelation(entry.projects);
    const existing = projectMap.get(key) ?? {
      projectId: key,
      projectName: project?.name ?? "Ohne Projekt",
      projectCode: project?.code ?? null,
      workedMinutes: 0,
      entryCount: 0,
    };

    existing.workedMinutes += computeWorkedMinutes(entry, entry.time_entry_breaks ?? []);
    existing.entryCount += 1;
    projectMap.set(key, existing);
  }

  const projects = Array.from(projectMap.values()).sort(
    (left, right) => right.workedMinutes - left.workedMinutes
  );
  const totalWorkedMinutes = projects.reduce((sum, project) => sum + project.workedMinutes, 0);

  return {
    totalWorkedMinutes,
    projects: projects.map((project) => ({
      ...project,
      sharePercent:
        totalWorkedMinutes > 0 ? Number(((project.workedMinutes / totalWorkedMinutes) * 100).toFixed(1)) : 0,
    })),
  };
}
