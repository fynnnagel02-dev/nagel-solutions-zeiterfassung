import "server-only";

import {
  assertAdmin,
  assertEmployeeIsActive,
  assertHasEmployee,
  assertTeamLeadScopeForEmployee,
} from "@/src/lib/auth/assertions";
import { logTimeEntryAuditEvent } from "@/src/lib/audit/log";
import {
  assertNoOpenBreak,
  createSyntheticManualBreak,
  findAutoLegalBreakWindow,
  getAdditionalAutoLegalBreakMinutes,
} from "@/src/lib/domain/time-calculations";
import { ConflictError, NotFoundError } from "@/src/lib/security/errors";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";
import {
  endBreakSchema,
  endWorkdaySchema,
  liveWorkdaySchema,
  manualTimeEntrySchema,
  reopenTimeEntrySchema,
  startBreakSchema,
  submitTimeEntrySchema,
  updateEditableTimeEntrySchema,
} from "@/src/lib/validations/time-entry";

async function getTimeEntryWithBreaks(timeEntryId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("time_entries")
    .select("*, time_entry_breaks(*)")
    .eq("id", timeEntryId)
    .single();

  if (error || !data) {
    throw new NotFoundError("Time entry not found");
  }

  return data;
}

async function assertActiveProject(projectId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    throw new ConflictError("Bitte ein aktives Projekt auswählen.");
  }
}

function assertEditableEntry(entry: {
  locked_at: string | null;
  approval_status: string;
  status: string;
}) {
  if (entry.locked_at || entry.approval_status === "approved" || entry.status === "approved") {
    throw new ConflictError("This time entry is no longer directly editable");
  }
}

async function syncAutoLegalBreaks(timeEntryId: string) {
  const admin = createSupabaseAdminClient();
  const entry = await getTimeEntryWithBreaks(timeEntryId);

  if (!entry.started_at || !entry.ended_at) {
    return entry;
  }

  const nonAutoBreaks = (entry.time_entry_breaks ?? []).filter(
    (currentBreak: { source?: string | null }) => currentBreak.source !== "auto_legal"
  );
  const additionalMinutes = getAdditionalAutoLegalBreakMinutes({
    startedAt: entry.started_at,
    endedAt: entry.ended_at,
    breaks: nonAutoBreaks,
  });

  const { error: deleteError } = await admin
    .from("time_entry_breaks")
    .delete()
    .eq("time_entry_id", timeEntryId)
    .eq("source", "auto_legal");

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (additionalMinutes <= 0) {
    return getTimeEntryWithBreaks(timeEntryId);
  }

  const autoBreakWindow = findAutoLegalBreakWindow({
    startedAt: entry.started_at,
    endedAt: entry.ended_at,
    breakMinutes: additionalMinutes,
    existingBreaks: nonAutoBreaks,
  });

  const { error: insertError } = await admin.from("time_entry_breaks").insert({
    time_entry_id: timeEntryId,
    started_at: autoBreakWindow.startedAt,
    ended_at: autoBreakWindow.endedAt,
    source: "auto_legal",
  });

  if (insertError) {
    const fallbackInsert = await admin.from("time_entry_breaks").insert({
      time_entry_id: timeEntryId,
      started_at: autoBreakWindow.startedAt,
      ended_at: autoBreakWindow.endedAt,
      source: "manual",
    });

    if (fallbackInsert.error) {
      throw new Error(insertError.message);
    }
  }

  return getTimeEntryWithBreaks(timeEntryId);
}

export async function startWorkday(input: unknown) {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const payload = liveWorkdaySchema.parse(input);
  const admin = createSupabaseAdminClient();
  await assertActiveProject(payload.projectId);

  const { data, error } = await admin
    .from("time_entries")
    .insert({
      employee_id: employee.id,
      entry_date: payload.entryDate,
      started_at: payload.startedAt,
      source: "live",
      status: "open",
      approval_status: "not_submitted",
      project_id: payload.projectId,
    })
    .select("*, time_entry_breaks(*)")
    .single();

  if (error) {
    throw new ConflictError(error.message);
  }

  await logTimeEntryAuditEvent({
    timeEntryId: data.id,
    actorProfileId: context.profile.id,
    actorEmployeeId: employee.id,
    eventType: "time_entry.started",
    newValues: data,
  });

  return data;
}

export async function startBreak(input: unknown) {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const payload = startBreakSchema.parse(input);
  const entry = await getTimeEntryWithBreaks(payload.timeEntryId);

  if (entry.employee_id !== employee.id) {
    throw new ConflictError("You can only start a break on your own time entry");
  }

  if (!entry.started_at || entry.ended_at) {
    throw new ConflictError("Breaks can only be started on an open workday");
  }

  assertNoOpenBreak(entry.time_entry_breaks ?? []);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("start_break", {
    target_time_entry_id: payload.timeEntryId,
    target_started_at: payload.startedAt,
  });

  if (error) {
    throw new ConflictError(error.message);
  }

  return data;
}

export async function endBreak(input: unknown) {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const payload = endBreakSchema.parse(input);
  const entry = await getTimeEntryWithBreaks(payload.timeEntryId);

  if (entry.employee_id !== employee.id) {
    throw new ConflictError("You can only end a break on your own time entry");
  }

  const openBreak = (entry.time_entry_breaks ?? []).find(
    (currentBreak: { ended_at: string | null }) => !currentBreak.ended_at
  );

  if (!openBreak) {
    throw new ConflictError("No open break exists");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("end_break", {
    target_time_entry_id: payload.timeEntryId,
    target_ended_at: payload.endedAt,
  });

  if (error) {
    throw new ConflictError(error.message);
  }

  return data;
}

export async function endWorkday(input: unknown) {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const payload = endWorkdaySchema.parse(input);
  const entry = await getTimeEntryWithBreaks(payload.timeEntryId);

  if (entry.employee_id !== employee.id) {
    throw new ConflictError("You can only end your own workday");
  }

  assertNoOpenBreak(entry.time_entry_breaks ?? []);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("end_workday", {
    target_time_entry_id: payload.timeEntryId,
    target_ended_at: payload.endedAt,
  });

  if (error) {
    throw new ConflictError(error.message);
  }

  const finalizedEntry = await syncAutoLegalBreaks(data.id);

  await logTimeEntryAuditEvent({
    timeEntryId: data.id,
    actorProfileId: context.profile.id,
    actorEmployeeId: employee.id,
    eventType: "time_entry.ended",
    oldValues: entry,
    newValues: finalizedEntry,
  });

  return finalizedEntry;
}

async function recreateManualBreak(
  timeEntryId: string,
  startedAt: string,
  endedAt: string,
  breakMinutes: number
) {
  const admin = createSupabaseAdminClient();
  const { error: deleteError } = await admin
    .from("time_entry_breaks")
    .delete()
    .eq("time_entry_id", timeEntryId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const syntheticBreak = createSyntheticManualBreak(startedAt, endedAt, breakMinutes);
  if (!syntheticBreak) {
    return;
  }

  const { error: insertError } = await admin.from("time_entry_breaks").insert({
    time_entry_id: timeEntryId,
    started_at: syntheticBreak.started_at,
    ended_at: syntheticBreak.ended_at,
    source: syntheticBreak.source,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

function resolveMutationEmployeeId(
  contextEmployeeId: string,
  requestedEmployeeId?: string
) {
  return requestedEmployeeId ?? contextEmployeeId;
}

export async function saveManualTimeEntry(input: unknown) {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const payload = manualTimeEntrySchema.parse(input);
  const targetEmployeeId = resolveMutationEmployeeId(employee.id, payload.employeeId);

  if (targetEmployeeId !== employee.id) {
    await assertAdmin();
  }
  await assertActiveProject(payload.projectId);

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("time_entries")
    .select("id, locked_at, approval_status, status")
    .eq("employee_id", targetEmployeeId)
    .eq("entry_date", payload.entryDate)
    .maybeSingle();

  if (existing) {
    assertEditableEntry(existing);
    return updateEditableTimeEntry({
      timeEntryId: existing.id,
      entryDate: payload.entryDate,
      startedAt: payload.startedAt,
      endedAt: payload.endedAt,
      breakMinutes: payload.breakMinutes,
      projectId: payload.projectId,
      comment: payload.comment ?? null,
    });
  }

  const { data, error } = await admin
    .from("time_entries")
    .insert({
      employee_id: targetEmployeeId,
      entry_date: payload.entryDate,
      started_at: payload.startedAt,
      ended_at: payload.endedAt,
      source: "manual",
      status: "complete",
      approval_status: "not_submitted",
      project_id: payload.projectId,
      comment: payload.comment ?? null,
    })
    .select("*, time_entry_breaks(*)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await recreateManualBreak(data.id, payload.startedAt, payload.endedAt, payload.breakMinutes);

  return getTimeEntryWithBreaks(data.id);
}

export async function updateEditableTimeEntry(input: unknown) {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const payload = updateEditableTimeEntrySchema.parse(input);
  const existing = await getTimeEntryWithBreaks(payload.timeEntryId);

  if (existing.employee_id !== employee.id) {
    await assertAdmin();
  }

  assertEditableEntry(existing);
  if (payload.projectId) {
    await assertActiveProject(payload.projectId);
  }
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("time_entries")
    .update({
      entry_date: payload.entryDate ?? existing.entry_date,
      started_at: payload.startedAt ?? existing.started_at,
      ended_at: payload.endedAt ?? existing.ended_at,
      project_id: payload.projectId ?? existing.project_id,
      comment: payload.comment ?? existing.comment,
      source: "manual",
      status: payload.endedAt ?? existing.ended_at ? "complete" : existing.status,
    })
    .eq("id", payload.timeEntryId)
    .select("*, time_entry_breaks(*)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await recreateManualBreak(
    payload.timeEntryId,
    payload.startedAt ?? existing.started_at,
    payload.endedAt ?? existing.ended_at,
    payload.breakMinutes ?? 0
  );

  await logTimeEntryAuditEvent({
    timeEntryId: payload.timeEntryId,
    actorProfileId: context.profile.id,
    actorEmployeeId: employee.id,
    eventType: "time_entry.updated",
    oldValues: existing,
    newValues: data,
  });

  return getTimeEntryWithBreaks(payload.timeEntryId);
}

export async function submitTimeEntryForApproval(input: unknown) {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const payload = submitTimeEntrySchema.parse(input);
  const entry = await getTimeEntryWithBreaks(payload.timeEntryId);

  if (entry.employee_id !== employee.id) {
    throw new ConflictError("You can only submit your own time entry");
  }

  if (!entry.ended_at) {
    throw new ConflictError("Only completed entries can be submitted");
  }

  if (!entry.project_id) {
    throw new ConflictError("Bitte ordnen Sie dem Eintrag vor der Freigabe ein Projekt zu.");
  }

  await syncAutoLegalBreaks(payload.timeEntryId);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("time_entries")
    .update({
      approval_status: "pending",
      status: "in_review",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", payload.timeEntryId)
    .select("*, time_entry_breaks(*)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function reopenTimeEntry(input: unknown) {
  await assertAdmin();
  const payload = reopenTimeEntrySchema.parse(input);
  const entry = await getTimeEntryWithBreaks(payload.timeEntryId);
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("time_entries")
    .update({
      status: "complete",
      approval_status: "not_submitted",
      submitted_at: null,
      locked_at: null,
      approved_at: null,
      approved_by_employee_id: null,
      rejected_at: null,
      rejected_by_employee_id: null,
    })
    .eq("id", payload.timeEntryId)
    .select("*, time_entry_breaks(*)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await logTimeEntryAuditEvent({
    timeEntryId: payload.timeEntryId,
    actorProfileId: null,
    actorEmployeeId: null,
    eventType: "time_entry.reopened",
    oldValues: entry,
    newValues: { ...data, reason: payload.reason },
  });

  return data;
}

export async function approveTimeEntry(timeEntryId: string, reason?: string) {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const entry = await getTimeEntryWithBreaks(timeEntryId);
  await assertTeamLeadScopeForEmployee(entry.employee_id);
  await syncAutoLegalBreaks(timeEntryId);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("approve_time_entry", {
    target_time_entry_id: timeEntryId,
    actor_employee_id: employee.id,
    actor_decision_reason: reason ?? null,
  });

  if (error) {
    throw new ConflictError(error.message);
  }

  return getTimeEntryWithBreaks(data.id);
}

export async function rejectTimeEntry(timeEntryId: string, reason?: string) {
  const context = await assertEmployeeIsActive();
  const employee = assertHasEmployee(context);
  const entry = await getTimeEntryWithBreaks(timeEntryId);
  await assertTeamLeadScopeForEmployee(entry.employee_id);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("reject_time_entry", {
    target_time_entry_id: timeEntryId,
    actor_employee_id: employee.id,
    actor_decision_reason: reason ?? null,
  });

  if (error) {
    throw new ConflictError(error.message);
  }

  return getTimeEntryWithBreaks(data.id);
}
