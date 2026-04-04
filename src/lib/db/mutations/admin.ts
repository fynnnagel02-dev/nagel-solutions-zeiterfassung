import "server-only";

import { assertAdmin } from "@/src/lib/auth/assertions";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";
import {
  archiveProjectSchema,
  archiveTeamSchema,
  createEmployeeSchema,
  createHolidaySchema,
  createProjectSchema,
  createTeamSchema,
  deleteHolidaySchema,
  createWorkScheduleSchema,
  assignTeamLeadSchema,
  updateHolidaySchema,
  updateCompanySettingsSchema,
  updateEmployeeSchema,
  updateProjectSchema,
  updateTeamSchema,
  updateWorkScheduleSchema,
} from "@/src/lib/validations/admin";

export async function createEmployee(input: unknown) {
  await assertAdmin();
  const payload = createEmployeeSchema.parse(input);
  const admin = createSupabaseAdminClient();

  let authUserId = payload.authUserId;
  if (!authUserId && payload.email) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(payload.email);
    if (error || !data.user) {
      throw new Error(error?.message ?? "Unable to invite user");
    }
    authUserId = data.user.id;
  }

  if (!authUserId) {
    throw new Error("Missing auth user id after invite flow");
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: authUserId,
    role: payload.role,
    is_active: true,
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { data: employee, error: employeeError } = await admin
    .from("employees")
    .insert({
      profile_id: authUserId,
      employee_number: payload.employeeNumber ?? null,
      first_name: payload.firstName,
      last_name: payload.lastName,
      team_id: payload.teamId ?? null,
      work_schedule_id: payload.workScheduleId ?? null,
      employment_start_date: payload.employmentStartDate,
      employment_end_date: payload.employmentEndDate ?? null,
      target_daily_minutes_override: payload.targetDailyMinutesOverride ?? null,
      target_weekly_minutes_override: payload.targetWeeklyMinutesOverride ?? null,
      is_active: true,
    })
    .select("*")
    .single();

  if (employeeError) {
    throw new Error(employeeError.message);
  }

  await admin.from("employee_leave_settings").upsert({
    employee_id: employee.id,
  });

  return employee;
}

export async function updateEmployee(input: unknown) {
  await assertAdmin();
  const payload = updateEmployeeSchema.parse(input);
  const admin = createSupabaseAdminClient();

  if (payload.role) {
    const { data: employee } = await admin
      .from("employees")
      .select("profile_id")
      .eq("id", payload.employeeId)
      .single();

    if (employee?.profile_id) {
      const { error: profileError } = await admin
        .from("profiles")
        .update({ role: payload.role })
        .eq("id", employee.profile_id);

      if (profileError) {
        throw new Error(profileError.message);
      }
    }
  }

  const updatePayload = {
    employee_number: payload.employeeNumber,
    first_name: payload.firstName,
    last_name: payload.lastName,
    team_id: payload.teamId,
    work_schedule_id: payload.workScheduleId,
    employment_start_date: payload.employmentStartDate,
    employment_end_date: payload.employmentEndDate,
    target_daily_minutes_override: payload.targetDailyMinutesOverride,
    target_weekly_minutes_override: payload.targetWeeklyMinutesOverride,
  };

  const { data, error } = await admin
    .from("employees")
    .update(updatePayload)
    .eq("id", payload.employeeId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deactivateEmployee(employeeId: string, reason?: string) {
  await assertAdmin();
  const admin = createSupabaseAdminClient();
  const { data: employee, error: employeeError } = await admin
    .from("employees")
    .select("id, profile_id")
    .eq("id", employeeId)
    .single();

  if (employeeError) {
    throw new Error(employeeError.message);
  }

  const { error: updateEmployeeError } = await admin
    .from("employees")
    .update({
      is_active: false,
      deactivated_at: new Date().toISOString(),
      deactivation_reason: reason ?? null,
    })
    .eq("id", employeeId);

  if (updateEmployeeError) {
    throw new Error(updateEmployeeError.message);
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ is_active: false })
    .eq("id", employee.profile_id);

  if (profileError) {
    throw new Error(profileError.message);
  }
}

export async function createTeam(input: unknown) {
  await assertAdmin();
  const payload = createTeamSchema.parse(input);
  const admin = createSupabaseAdminClient();

  if (payload.teamLeadEmployeeId) {
    throw new Error(
      "Assign the team lead after the employee belongs to the team. Use assignTeamLead as a separate step."
    );
  }

  const { data, error } = await admin
    .from("teams")
    .insert({
      name: payload.name,
      team_lead_employee_id: null,
      is_active: payload.isActive ?? true,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateTeam(input: unknown) {
  await assertAdmin();
  const payload = updateTeamSchema.parse(input);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("teams")
    .update({
      name: payload.name,
      team_lead_employee_id: payload.teamLeadEmployeeId,
      is_active: payload.isActive,
    })
    .eq("id", payload.teamId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (payload.memberIds) {
    const { error: clearMembersError } = await admin
      .from("employees")
      .update({ team_id: null })
      .eq("team_id", payload.teamId);

    if (clearMembersError) {
      throw new Error(clearMembersError.message);
    }

    if (payload.memberIds.length > 0) {
      const { error: assignMembersError } = await admin
        .from("employees")
        .update({ team_id: payload.teamId })
        .in("id", payload.memberIds);

      if (assignMembersError) {
        throw new Error(assignMembersError.message);
      }
    }
  }

  return data;
}

export async function archiveTeam(input: unknown) {
  await assertAdmin();
  const payload = archiveTeamSchema.parse(input);
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("teams")
    .update({ is_active: payload.isActive ?? false })
    .eq("id", payload.teamId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function assignTeamLead(input: unknown) {
  await assertAdmin();
  const payload = assignTeamLeadSchema.parse(input);
  const admin = createSupabaseAdminClient();

  if (payload.teamLeadEmployeeId) {
    const { data: leadEmployee, error: leadEmployeeError } = await admin
      .from("employees")
      .select("id, team_id")
      .eq("id", payload.teamLeadEmployeeId)
      .single();

    if (leadEmployeeError) {
      throw new Error(leadEmployeeError.message);
    }

    if (leadEmployee.team_id !== payload.teamId) {
      throw new Error("Team lead employee must already belong to the team");
    }
  }

  const { data, error } = await admin
    .from("teams")
    .update({
      team_lead_employee_id: payload.teamLeadEmployeeId,
    })
    .eq("id", payload.teamId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createWorkSchedule(input: unknown) {
  await assertAdmin();
  const payload = createWorkScheduleSchema.parse(input);
  const admin = createSupabaseAdminClient();

  const { data: schedule, error: scheduleError } = await admin
    .from("work_schedules")
        .insert({
          name: payload.name,
          weekly_target_minutes: payload.weeklyTargetMinutes,
          is_active: payload.isActive ?? true,
        })
    .select("*")
    .single();

  if (scheduleError) {
    throw new Error(scheduleError.message);
  }

  const { error: daysError } = await admin.from("work_schedule_days").insert(
    payload.days.map((day) => ({
      work_schedule_id: schedule.id,
      weekday: day.weekday,
      is_workday: day.isWorkday,
      target_minutes: day.targetMinutes,
    }))
  );

  if (daysError) {
    throw new Error(daysError.message);
  }

  return schedule;
}

export async function updateWorkSchedule(input: unknown) {
  await assertAdmin();
  const payload = updateWorkScheduleSchema.parse(input);
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("work_schedules")
    .update({
      name: payload.name,
      weekly_target_minutes: payload.weeklyTargetMinutes,
      is_active: payload.isActive,
    })
    .eq("id", payload.workScheduleId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (payload.days) {
    const { error: deleteError } = await admin
      .from("work_schedule_days")
      .delete()
      .eq("work_schedule_id", payload.workScheduleId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    const { error: insertError } = await admin.from("work_schedule_days").insert(
      payload.days.map((day) => ({
        work_schedule_id: payload.workScheduleId,
        weekday: day.weekday,
        is_workday: day.isWorkday,
        target_minutes: day.targetMinutes,
      }))
    );

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  return data;
}

export async function updateCompanySettings(input: unknown) {
  await assertAdmin();
  const payload = updateCompanySettingsSchema.parse(input);
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("company_settings")
    .update({
      company_name: payload.companyName,
      timezone: payload.timezone,
      holiday_region_code: payload.holidayRegionCode,
      default_daily_target_minutes: payload.defaultDailyTargetMinutes,
      default_weekly_target_minutes: payload.defaultWeeklyTargetMinutes,
      default_annual_leave_days: payload.defaultAnnualLeaveDays,
      carry_over_enabled: payload.carryOverEnabled,
    })
    .eq("id", 1)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createProject(input: unknown) {
  await assertAdmin();
  const payload = createProjectSchema.parse(input);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("projects")
    .insert({
      name: payload.name,
      code: payload.code ?? null,
      description: payload.description ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateProject(input: unknown) {
  await assertAdmin();
  const payload = updateProjectSchema.parse(input);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("projects")
    .update({
      name: payload.name,
      code: payload.code,
      description: payload.description,
      is_active: payload.isActive,
    })
    .eq("id", payload.projectId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function archiveProject(input: unknown) {
  await assertAdmin();
  const payload = archiveProjectSchema.parse(input);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("projects")
    .update({ is_active: payload.isActive ?? false })
    .eq("id", payload.projectId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createHoliday(input: unknown) {
  await assertAdmin();
  const payload = createHolidaySchema.parse(input);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("holidays")
    .upsert(
      payload.regionCodes.map((regionCode) => ({
        holiday_date: payload.holidayDate,
        region_code: regionCode,
        name: payload.name,
        is_company_observed: payload.isCompanyObserved ?? true,
      }))
    )
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateHoliday(input: unknown) {
  await assertAdmin();
  const payload = updateHolidaySchema.parse(input);
  const admin = createSupabaseAdminClient();

  const { error: deleteError } = await admin
    .from("holidays")
    .delete()
    .in("id", payload.holidayIds);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  return createHoliday({
    holidayDate: payload.holidayDate,
    regionCodes: payload.regionCodes,
    name: payload.name,
    isCompanyObserved: payload.isCompanyObserved,
  });
}

export async function deleteHoliday(input: unknown) {
  await assertAdmin();
  const payload = deleteHolidaySchema.parse(input);
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("holidays").delete().in("id", payload.holidayIds);

  if (error) {
    throw new Error(error.message);
  }
}
