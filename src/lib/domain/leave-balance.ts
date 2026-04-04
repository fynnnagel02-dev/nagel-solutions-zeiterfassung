import "server-only";

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

export async function getLeaveBalanceSnapshot(
  employeeId: string,
  year: number
): Promise<LeaveBalanceSnapshot> {
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
