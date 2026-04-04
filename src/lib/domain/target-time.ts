import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";

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

  if (employee.target_daily_minutes_override !== null) {
    return employee.target_daily_minutes_override;
  }

  if (!employee.work_schedule_id) {
    return companySettings.default_daily_target_minutes;
  }

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

  return scheduleDay.target_minutes;
}
