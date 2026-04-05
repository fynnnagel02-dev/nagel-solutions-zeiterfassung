import "server-only";

import { getAppRuntimeState } from "@/src/lib/demo/runtime";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";
import { getTargetMinutesForEmployeeOnDate } from "@/src/lib/domain/target-time";
import { ConflictError } from "@/src/lib/security/errors";
import type { DayPart, LeaveBalanceSnapshot, LeaveType } from "@/src/lib/types/domain";

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getRequestedDayUnits(
  startDayPart: DayPart,
  endDayPart: DayPart,
  startDate: string,
  endDate: string
) {
  if (startDate === endDate) {
    if (startDayPart === "full" && endDayPart === "full") {
      return 1;
    }

    return 0.5;
  }

  return 1;
}

export async function computeVacationConsumptionDays(
  employeeId: string,
  startDate: string,
  endDate: string,
  startDayPart: DayPart,
  endDayPart: DayPart
) {
  let total = 0;
  const cursor = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);

  while (cursor <= end) {
    const currentDate = toDateKey(cursor);
    const targetMinutes = await getTargetMinutesForEmployeeOnDate(employeeId, currentDate);

    if (targetMinutes > 0) {
      if (currentDate === startDate && currentDate === endDate) {
        total += getRequestedDayUnits(startDayPart, endDayPart, startDate, endDate);
      } else if (currentDate === startDate && startDayPart !== "full") {
        total += 0.5;
      } else if (currentDate === endDate && endDayPart !== "full") {
        total += 0.5;
      } else {
        total += 1;
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return total;
}

function toNumeric(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function clampRequestToYear(
  year: number,
  startDate: string,
  endDate: string,
  startDayPart: DayPart,
  endDayPart: DayPart
) {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const clampedStartDate = startDate < yearStart ? yearStart : startDate;
  const clampedEndDate = endDate > yearEnd ? yearEnd : endDate;

  return {
    startDate: clampedStartDate,
    endDate: clampedEndDate,
    startDayPart: clampedStartDate === startDate ? startDayPart : ("full" as const),
    endDayPart: clampedEndDate === endDate ? endDayPart : ("full" as const),
  };
}

async function getDemoLeaveBalanceSnapshot(
  employeeId: string,
  year: number
): Promise<LeaveBalanceSnapshot> {
  const admin = createSupabaseAdminClient();
  const { data: seededBalance, error: seededBalanceError } = await admin
    .from("leave_balance_years")
    .select(
      "entitlement_days, carried_over_days, adjustment_days, approved_taken_days, pending_requested_days, available_days"
    )
    .eq("employee_id", employeeId)
    .eq("balance_year", year)
    .maybeSingle();

  if (seededBalanceError) {
    throw new Error(seededBalanceError.message);
  }

  if (seededBalance) {
    return {
      entitlementDays: toNumeric(seededBalance.entitlement_days),
      carriedOverDays: toNumeric(seededBalance.carried_over_days),
      adjustmentDays: toNumeric(seededBalance.adjustment_days),
      approvedTakenDays: toNumeric(seededBalance.approved_taken_days),
      pendingRequestedDays: toNumeric(seededBalance.pending_requested_days),
      availableDays: toNumeric(seededBalance.available_days),
    };
  }

  const [
    { data: companySettings, error: companyError },
    { data: employeeLeaveSettings, error: employeeLeaveSettingsError },
    { data: leaveBalanceAdjustments, error: leaveBalanceAdjustmentsError },
    { data: leaveRequests, error: leaveRequestsError },
  ] = await Promise.all([
    admin
      .from("company_settings")
      .select("default_annual_leave_days, carry_over_enabled")
      .eq("id", 1)
      .single(),
    admin
      .from("employee_leave_settings")
      .select("annual_entitlement_days")
      .eq("employee_id", employeeId)
      .maybeSingle(),
    admin
      .from("leave_balance_adjustments")
      .select("adjustment_days")
      .eq("employee_id", employeeId)
      .eq("balance_year", year),
    admin
      .from("leave_requests")
      .select("leave_type, start_date, end_date, start_day_part, end_day_part, status")
      .eq("employee_id", employeeId)
      .eq("leave_type", "vacation")
      .lte("start_date", `${year}-12-31`)
      .gte("end_date", `${year}-01-01`)
      .in("status", ["approved", "pending"]),
  ]);

  if (companyError || employeeLeaveSettingsError || leaveBalanceAdjustmentsError || leaveRequestsError) {
    throw new Error(
      companyError?.message ??
        employeeLeaveSettingsError?.message ??
        leaveBalanceAdjustmentsError?.message ??
        leaveRequestsError?.message ??
        "Unable to load demo leave balance"
    );
  }

  let carriedOverDays = 0;
  if (companySettings.carry_over_enabled) {
    const { data: priorYearBalance, error: priorYearBalanceError } = await admin
      .from("leave_balance_years")
      .select("available_days")
      .eq("employee_id", employeeId)
      .eq("balance_year", year - 1)
      .maybeSingle();

    if (priorYearBalanceError) {
      throw new Error(priorYearBalanceError.message);
    }

    carriedOverDays = Math.max(toNumeric(priorYearBalance?.available_days), 0);
  }

  const entitlementDays = toNumeric(
    employeeLeaveSettings?.annual_entitlement_days ?? companySettings.default_annual_leave_days
  );
  const adjustmentDays = leaveBalanceAdjustments.reduce(
    (sum, item) => sum + toNumeric(item.adjustment_days),
    0
  );

  let approvedTakenDays = 0;
  let pendingRequestedDays = 0;

  for (const request of leaveRequests) {
    const clampedRequest = clampRequestToYear(
      year,
      request.start_date,
      request.end_date,
      request.start_day_part,
      request.end_day_part
    );
    const consumptionDays = await computeVacationConsumptionDays(
      employeeId,
      clampedRequest.startDate,
      clampedRequest.endDate,
      clampedRequest.startDayPart,
      clampedRequest.endDayPart
    );

    if (request.status === "approved") {
      approvedTakenDays += consumptionDays;
    } else if (request.status === "pending") {
      pendingRequestedDays += consumptionDays;
    }
  }

  return {
    entitlementDays,
    carriedOverDays,
    adjustmentDays,
    approvedTakenDays,
    pendingRequestedDays,
    availableDays:
      entitlementDays + carriedOverDays + adjustmentDays - approvedTakenDays - pendingRequestedDays,
  };
}

export async function getLeaveBalanceSnapshot(
  employeeId: string,
  year: number
): Promise<LeaveBalanceSnapshot> {
  const runtime = await getAppRuntimeState();

  // Demo reads must stay side-effect free and may never trigger a recomputation RPC.
  if (runtime.isDemo) {
    return getDemoLeaveBalanceSnapshot(employeeId, year);
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("recompute_leave_balance_year", {
    target_employee_id: employeeId,
    target_year: year,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to compute leave balance");
  }

  return {
    entitlementDays: Number(data.entitlement_days),
    carriedOverDays: Number(data.carried_over_days),
    adjustmentDays: Number(data.adjustment_days),
    approvedTakenDays: Number(data.approved_taken_days),
    pendingRequestedDays: Number(data.pending_requested_days),
    availableDays: Number(data.available_days),
  };
}

export async function assertLeaveFitsBalance(
  employeeId: string,
  leaveType: LeaveType,
  requestedDays: number,
  year: number
) {
  if (leaveType !== "vacation") {
    return;
  }

  const snapshot = await getLeaveBalanceSnapshot(employeeId, year);
  if (snapshot.availableDays < requestedDays) {
    throw new ConflictError("Vacation request exceeds available balance");
  }
}
