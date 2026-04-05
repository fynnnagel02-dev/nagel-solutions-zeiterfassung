import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";

function computePartialLeaveMinutes(request: {
  partial_start_time?: string | null;
  partial_end_time?: string | null;
  start_day_part?: "full" | "morning" | "afternoon" | null;
  end_day_part?: "full" | "morning" | "afternoon" | null;
}, targetMinutes: number) {
  if (request.partial_start_time && request.partial_end_time) {
    const [startHour, startMinute] = request.partial_start_time.split(":").map(Number);
    const [endHour, endMinute] = request.partial_end_time.split(":").map(Number);
    const durationMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
    return Math.max(0, durationMinutes);
  }

  if (
    request.start_day_part !== "full" ||
    request.end_day_part !== "full"
  ) {
    return Math.round(targetMinutes / 2);
  }

  return 0;
}

export async function getTargetMinutesForEmployeeOnDate(
  employeeId: string,
  date: string
) {
  const admin = createSupabaseAdminClient();
  const { data: employee, error: employeeError } = await admin
    .from("employees")
    .select("id, work_schedule_id, target_daily_minutes_override")
    .eq("id", employeeId)
    .maybeSingle();

  if (employeeError || !employee) {
    throw new Error(employeeError?.message ?? "Employee not found");
  }

  const { data: companySettings, error: companyError } = await admin
    .from("company_settings")
    .select("holiday_region_code, default_daily_target_minutes")
    .eq("id", 1)
    .single();

  if (companyError) {
    throw new Error(companyError.message);
  }

  const { data: holiday } = await admin
    .from("holidays")
    .select("id")
    .eq("holiday_date", date)
    .eq("region_code", companySettings.holiday_region_code)
    .maybeSingle();

  if (holiday) {
    return 0;
  }

  let targetMinutes = 0;

  if (employee.target_daily_minutes_override !== null) {
    targetMinutes = employee.target_daily_minutes_override;
  } else if (!employee.work_schedule_id) {
    targetMinutes = companySettings.default_daily_target_minutes;
  } else {
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const mappedWeekday = weekday === 0 ? 7 : weekday;

    const { data: scheduleDay, error: scheduleDayError } = await admin
      .from("work_schedule_days")
      .select("target_minutes, is_workday")
      .eq("work_schedule_id", employee.work_schedule_id)
      .eq("weekday", mappedWeekday)
      .maybeSingle();

    if (scheduleDayError) {
      throw new Error(scheduleDayError.message);
    }

    if (!scheduleDay || !scheduleDay.is_workday) {
      return 0;
    }

    targetMinutes = scheduleDay.target_minutes;
  }

  const { data: partialSickLeave, error: leaveError } = await admin
    .from("leave_requests")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("leave_type", "sick")
    .lte("start_date", date)
    .gte("end_date", date)
    .in("status", ["pending", "approved"])
    .order("requested_at", { ascending: false })
    .limit(10);

  if (leaveError) {
    throw new Error(leaveError.message);
  }

  const partialLeave = (partialSickLeave ?? []).find((request) => {
    if (request.duration_mode === "partial_day") {
      return true;
    }

    return request.start_date === request.end_date && (
      request.start_day_part !== "full" ||
      request.end_day_part !== "full"
    );
  });

  if (!partialLeave) {
    return targetMinutes;
  }

  return Math.max(0, targetMinutes - computePartialLeaveMinutes(partialLeave, targetMinutes));
}
