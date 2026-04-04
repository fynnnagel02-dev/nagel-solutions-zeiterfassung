import "server-only";

import {
  assertEmployeeIsActive,
  assertHasEmployee,
  assertTeamLeadScopeForEmployee,
} from "@/src/lib/auth/assertions";
import { createSyntheticManualBreak } from "@/src/lib/domain/time-calculations";
import { ConflictError, NotFoundError } from "@/src/lib/security/errors";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";
import {
  decideTimeEntryChangeRequestSchema,
  timeEntryChangeRequestSchema,
} from "@/src/lib/validations/time-entry";

async function getChangeRequest(changeRequestId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("time_entry_change_requests")
    .select("*")
    .eq("id", changeRequestId)
    .single();

  if (error || !data) {
    throw new NotFoundError("Change request not found");
  }

  return data;
}

export async function createTimeEntryChangeRequest(input: unknown) {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const payload = timeEntryChangeRequestSchema.parse(input);
  const admin = createSupabaseAdminClient();

  const { data: entry, error: entryError } = await admin
    .from("time_entries")
    .select("id, employee_id, locked_at, approval_status, status")
    .eq("id", payload.timeEntryId)
    .single();

  if (entryError || !entry) {
    throw new NotFoundError("Time entry not found");
  }

  if (entry.employee_id !== employee.id) {
    throw new ConflictError("You can only request corrections for your own entries");
  }

  if (!entry.locked_at && entry.approval_status !== "approved" && entry.status !== "approved") {
    throw new ConflictError("Correction requests are only for locked or approved entries");
  }

  const { data, error } = await admin
    .from("time_entry_change_requests")
    .insert({
      time_entry_id: payload.timeEntryId,
      requested_by_employee_id: employee.id,
      reason: payload.reason,
      proposed_started_at: payload.proposedStartedAt ?? null,
      proposed_ended_at: payload.proposedEndedAt ?? null,
      proposed_break_minutes: payload.proposedBreakMinutes ?? null,
      proposed_project_id: payload.proposedProjectId ?? null,
      proposed_comment: payload.proposedComment ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function withdrawTimeEntryChangeRequest(changeRequestId: string) {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const request = await getChangeRequest(changeRequestId);

  if (request.requested_by_employee_id !== employee.id || request.status !== "pending") {
    throw new ConflictError("Only your own pending request can be withdrawn");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("time_entry_change_requests")
    .update({ status: "withdrawn" })
    .eq("id", changeRequestId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function approveTimeEntryChangeRequest(input: unknown) {
  const context = await assertEmployeeIsActive();
  const actor = assertHasEmployee(context);
  const payload = decideTimeEntryChangeRequestSchema.parse(input);
  const request = await getChangeRequest(payload.changeRequestId);
  const admin = createSupabaseAdminClient();

  const { data: entry, error: entryError } = await admin
    .from("time_entries")
    .select("*")
    .eq("id", request.time_entry_id)
    .single();

  if (entryError || !entry) {
    throw new NotFoundError("Time entry not found");
  }

  const previousEntryState = entry;
  await assertTeamLeadScopeForEmployee(entry.employee_id);

  if (request.proposed_started_at && request.proposed_ended_at && request.proposed_break_minutes !== null) {
    createSyntheticManualBreak(
      request.proposed_started_at,
      request.proposed_ended_at,
      request.proposed_break_minutes ?? 0
    );
  }

  const { data, error } = await admin.rpc("approve_time_entry_change_request", {
    target_change_request_id: payload.changeRequestId,
    actor_employee_id: actor.id,
    actor_decision_reason: payload.reason ?? null,
  });

  if (error) {
    throw new ConflictError(error.message);
  }

  const { data: updatedEntry, error: updatedEntryError } = await admin
    .from("time_entries")
    .select("*, time_entry_breaks(*)")
    .eq("id", entry.id)
    .single();

  if (updatedEntryError || !updatedEntry) {
    throw new Error(updatedEntryError?.message ?? "Updated time entry not found");
  }

  return {
    ...data,
    updatedEntry,
    previousEntryState,
  };
}

export async function rejectTimeEntryChangeRequest(input: unknown) {
  const context = await assertEmployeeIsActive();
  const actor = assertHasEmployee(context);
  const payload = decideTimeEntryChangeRequestSchema.parse(input);
  const request = await getChangeRequest(payload.changeRequestId);
  const admin = createSupabaseAdminClient();

  const { data: entry, error: entryError } = await admin
    .from("time_entries")
    .select("employee_id")
    .eq("id", request.time_entry_id)
    .single();

  if (entryError || !entry) {
    throw new NotFoundError("Time entry not found");
  }

  await assertTeamLeadScopeForEmployee(entry.employee_id);

  const { data, error } = await admin.rpc("reject_time_entry_change_request", {
    target_change_request_id: payload.changeRequestId,
    actor_employee_id: actor.id,
    actor_decision_reason: payload.reason ?? null,
  });

  if (error) {
    throw new ConflictError(error.message);
  }

  return data;
}
