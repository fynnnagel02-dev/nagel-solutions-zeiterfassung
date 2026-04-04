import "server-only";

import {
  assertAdmin,
  assertEmployeeIsActive,
  assertHasEmployee,
  assertTeamLeadScopeForEmployee,
} from "@/src/lib/auth/assertions";
import {
  assertLeaveFitsBalance,
  computeVacationConsumptionDays,
  getLeaveBalanceSnapshot,
} from "@/src/lib/domain/leave-balance";
import { ConflictError, NotFoundError } from "@/src/lib/security/errors";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";
import {
  cancelLeaveRequestSchema,
  createLeaveRequestSchema,
  decideLeaveRequestSchema,
} from "@/src/lib/validations/leave";

async function getLeaveRequest(leaveRequestId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("leave_requests")
    .select("*")
    .eq("id", leaveRequestId)
    .single();

  if (error || !data) {
    throw new NotFoundError("Leave request not found");
  }

  return data;
}

export async function createLeaveRequest(input: unknown) {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const payload = createLeaveRequestSchema.parse(input);
  const targetEmployeeId = payload.employeeId ?? employee.id;

  if (targetEmployeeId !== employee.id) {
    await assertAdmin();
  }

  const admin = createSupabaseAdminClient();
  const { data: conflicts, error: conflictError } = await admin
    .from("leave_requests")
    .select("id")
    .eq("employee_id", targetEmployeeId)
    .in("status", ["pending", "approved"])
    .lte("start_date", payload.endDate)
    .gte("end_date", payload.startDate);

  if (conflictError) {
    throw new Error(conflictError.message);
  }

  if (conflicts.length > 0) {
    throw new ConflictError("The requested leave overlaps an existing leave request");
  }

  if (payload.leaveType === "vacation") {
    const requestedDays = await computeVacationConsumptionDays(
      targetEmployeeId,
      payload.startDate,
      payload.endDate,
      payload.startDayPart,
      payload.endDayPart
    );

    await assertLeaveFitsBalance(
      targetEmployeeId,
      payload.leaveType,
      requestedDays,
      Number(payload.startDate.slice(0, 4))
    );
  }

  const { data, error } = await admin
    .from("leave_requests")
    .insert({
      employee_id: targetEmployeeId,
      leave_type: payload.leaveType,
      start_date: payload.startDate,
      end_date: payload.endDate,
      start_day_part: payload.startDayPart,
      end_day_part: payload.endDayPart,
      comment: payload.comment ?? null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (payload.leaveType === "vacation") {
    await getLeaveBalanceSnapshot(targetEmployeeId, Number(payload.startDate.slice(0, 4)));
  }

  return data;
}

export async function cancelLeaveRequest(input: unknown) {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const payload = cancelLeaveRequestSchema.parse(input);
  const request = await getLeaveRequest(payload.leaveRequestId);

  if (request.employee_id !== employee.id && context.profile.role !== "admin") {
    throw new ConflictError("You can only cancel your own leave request");
  }

  if (request.status !== "pending") {
    throw new ConflictError("Only pending leave requests can be cancelled");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("leave_requests")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by_employee_id: employee.id,
    })
    .eq("id", payload.leaveRequestId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function approveLeaveRequest(input: unknown) {
  const context = await assertEmployeeIsActive();
  const actor = assertHasEmployee(context);
  const payload = decideLeaveRequestSchema.parse(input);
  const request = await getLeaveRequest(payload.leaveRequestId);
  await assertTeamLeadScopeForEmployee(request.employee_id);
  const admin = createSupabaseAdminClient();

  if (request.leave_type === "vacation") {
    const requestedDays = await computeVacationConsumptionDays(
      request.employee_id,
      request.start_date,
      request.end_date,
      request.start_day_part,
      request.end_day_part
    );

    await assertLeaveFitsBalance(
      request.employee_id,
      request.leave_type,
      requestedDays,
      Number(request.start_date.slice(0, 4))
    );
  }

  const { data, error } = await admin.rpc("approve_leave_request", {
    target_leave_request_id: request.id,
    actor_employee_id: actor.id,
    actor_decision_reason: payload.reason ?? null,
  });

  if (error) {
    throw new ConflictError(error.message);
  }

  return data;
}

export async function rejectLeaveRequest(input: unknown) {
  const context = await assertEmployeeIsActive();
  const actor = assertHasEmployee(context);
  const payload = decideLeaveRequestSchema.parse(input);
  const request = await getLeaveRequest(payload.leaveRequestId);
  await assertTeamLeadScopeForEmployee(request.employee_id);
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.rpc("reject_leave_request", {
    target_leave_request_id: request.id,
    actor_employee_id: actor.id,
    actor_decision_reason: payload.reason ?? null,
  });

  if (error) {
    throw new ConflictError(error.message);
  }

  return data;
}
