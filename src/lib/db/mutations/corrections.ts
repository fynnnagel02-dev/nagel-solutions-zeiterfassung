import "server-only";

import {
  assertEmployeeIsActive,
  assertHasEmployee,
  assertTeamLeadScopeForEmployee,
} from "@/src/lib/auth/assertions";
import {
  createSyntheticManualBreak,
  findAutoLegalBreakWindow,
  getAdditionalAutoLegalBreakMinutes,
} from "@/src/lib/domain/time-calculations";
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

async function assertActiveProject(projectId: string | null | undefined) {
  if (!projectId) {
    throw new ConflictError("Bitte wählen Sie ein Projekt für die Korrektur aus.");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    throw new ConflictError("Bitte wählen Sie ein aktives Projekt für die Korrektur aus.");
  }
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

  await assertActiveProject(payload.proposedProjectId ?? null);

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

  const nonAutoBreaks = (updatedEntry.time_entry_breaks ?? []).filter(
    (currentBreak: { source?: string | null }) => currentBreak.source !== "auto_legal"
  );
  const additionalMinutes =
    updatedEntry.started_at && updatedEntry.ended_at
      ? getAdditionalAutoLegalBreakMinutes({
          startedAt: updatedEntry.started_at,
          endedAt: updatedEntry.ended_at,
          breaks: nonAutoBreaks,
        })
      : 0;

  const { error: deleteAutoBreakError } = await admin
    .from("time_entry_breaks")
    .delete()
    .eq("time_entry_id", updatedEntry.id)
    .eq("source", "auto_legal");

  if (deleteAutoBreakError) {
    throw new Error(deleteAutoBreakError.message);
  }

  if (additionalMinutes > 0 && updatedEntry.started_at && updatedEntry.ended_at) {
    const autoBreakWindow = findAutoLegalBreakWindow({
      startedAt: updatedEntry.started_at,
      endedAt: updatedEntry.ended_at,
      breakMinutes: additionalMinutes,
      existingBreaks: nonAutoBreaks,
    });

    const { error: insertAutoBreakError } = await admin.from("time_entry_breaks").insert({
      time_entry_id: updatedEntry.id,
      started_at: autoBreakWindow.startedAt,
      ended_at: autoBreakWindow.endedAt,
      source: "auto_legal",
    });

    if (insertAutoBreakError) {
      const fallbackInsert = await admin.from("time_entry_breaks").insert({
        time_entry_id: updatedEntry.id,
        started_at: autoBreakWindow.startedAt,
        ended_at: autoBreakWindow.endedAt,
        source: "manual",
      });

      if (fallbackInsert.error) {
        throw new Error(insertAutoBreakError.message);
      }
    }
  }

  const { data: refreshedEntry, error: refreshedEntryError } = await admin
    .from("time_entries")
    .select("*, time_entry_breaks(*)")
    .eq("id", entry.id)
    .single();

  if (refreshedEntryError || !refreshedEntry) {
    throw new Error(refreshedEntryError?.message ?? "Updated time entry not found");
  }

  return {
    ...data,
    updatedEntry: refreshedEntry,
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
