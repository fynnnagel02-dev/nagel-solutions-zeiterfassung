import "server-only";

import { z } from "zod";

import { DEMO_EXPORT_MESSAGE, DEMO_READONLY_MESSAGE } from "@/src/lib/demo/messages";

export type DemoActionResult<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  ok: true;
  simulated: true;
  kind: string;
  message: string;
  tone: "warning" | "info";
  payload: TPayload;
};

function timestamp() {
  return new Date().toISOString();
}

function makeResult<TPayload extends Record<string, unknown>>(
  kind: string,
  message: string,
  payload: TPayload,
  tone: "warning" | "info" = "warning"
): DemoActionResult<TPayload> {
  return {
    ok: true,
    simulated: true,
    kind,
    message,
    tone,
    payload,
  };
}

export function simulateTimeAction(kind: string, input: unknown) {
  if (kind === "startWorkday") {
    const payload = z
      .object({ entryDate: z.string(), startedAt: z.string(), projectId: z.string() })
      .parse(input);
    return makeResult("simulated_workday_started", DEMO_READONLY_MESSAGE, {
      entryDate: payload.entryDate,
      startedAt: payload.startedAt,
      projectId: payload.projectId,
      simulatedAt: timestamp(),
    });
  }

  if (kind === "startBreak") {
    const payload = z.object({ timeEntryId: z.string(), startedAt: z.string() }).parse(input);
    return makeResult("simulated_break_started", DEMO_READONLY_MESSAGE, {
      timeEntryId: payload.timeEntryId,
      startedAt: payload.startedAt,
      simulatedAt: timestamp(),
    });
  }

  if (kind === "endBreak") {
    const payload = z.object({ timeEntryId: z.string(), endedAt: z.string() }).parse(input);
    return makeResult("simulated_break_ended", DEMO_READONLY_MESSAGE, {
      timeEntryId: payload.timeEntryId,
      endedAt: payload.endedAt,
      simulatedAt: timestamp(),
    });
  }

  if (kind === "endWorkday") {
    const payload = z.object({ timeEntryId: z.string(), endedAt: z.string() }).parse(input);
    return makeResult("simulated_workday_ended", DEMO_READONLY_MESSAGE, {
      timeEntryId: payload.timeEntryId,
      endedAt: payload.endedAt,
      simulatedAt: timestamp(),
    });
  }

  if (kind === "saveManualTimeEntry" || kind === "updateEditableTimeEntry") {
    const payload = z
      .object({
        entryDate: z.string().optional(),
        timeEntryId: z.string().optional(),
        startedAt: z.string().optional(),
        endedAt: z.string().optional(),
        projectId: z.string().nullable().optional(),
      })
      .parse(input);
    return makeResult("simulated_time_entry_saved", DEMO_READONLY_MESSAGE, {
      entryDate: payload.entryDate ?? null,
      timeEntryId: payload.timeEntryId ?? null,
      startedAt: payload.startedAt ?? null,
      endedAt: payload.endedAt ?? null,
      projectId: payload.projectId ?? null,
      simulatedAt: timestamp(),
    });
  }

  if (kind === "reopenTimeEntry") {
    const payload = z.object({ timeEntryId: z.string(), reason: z.string().optional() }).parse(input);
    return makeResult("simulated_time_entry_reopened", DEMO_READONLY_MESSAGE, {
      timeEntryId: payload.timeEntryId,
      reason: payload.reason ?? null,
      simulatedAt: timestamp(),
    });
  }

  const payload = z.object({ timeEntryId: z.string() }).parse(input);
  return makeResult("simulated_time_entry_submitted", DEMO_READONLY_MESSAGE, {
    timeEntryId: payload.timeEntryId,
    simulatedAt: timestamp(),
  });
}

export function simulateApprovalAction(kind: string, input: unknown) {
  if (kind === "approveTimeEntry" || kind === "rejectTimeEntry") {
    const payload = z.object({ timeEntryId: z.string(), reason: z.string().optional() }).parse(input);
    return makeResult(
      kind === "approveTimeEntry" ? "simulated_time_entry_approved" : "simulated_time_entry_rejected",
      DEMO_READONLY_MESSAGE,
      { timeEntryId: payload.timeEntryId, reason: payload.reason ?? null, simulatedAt: timestamp() }
    );
  }

  if (kind === "approveLeaveRequest" || kind === "rejectLeaveRequest") {
    const payload = z.object({ leaveRequestId: z.string(), reason: z.string().nullable().optional() }).parse(input);
    return makeResult(
      kind === "approveLeaveRequest" ? "simulated_leave_request_approved" : "simulated_leave_request_rejected",
      DEMO_READONLY_MESSAGE,
      { leaveRequestId: payload.leaveRequestId, reason: payload.reason ?? null, simulatedAt: timestamp() }
    );
  }

  const payload = z.object({ changeRequestId: z.string(), reason: z.string().nullable().optional() }).parse(input);
  return makeResult(
    kind === "approveTimeEntryChangeRequest"
      ? "simulated_correction_request_approved"
      : "simulated_correction_request_rejected",
    DEMO_READONLY_MESSAGE,
    { changeRequestId: payload.changeRequestId, reason: payload.reason ?? null, simulatedAt: timestamp() }
  );
}

export function simulateLeaveAction(kind: string, input: unknown) {
  if (kind === "createLeaveRequest") {
    const payload = z
      .object({
        leaveType: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        durationMode: z.string().optional(),
        partialStartTime: z.string().nullable().optional(),
        partialEndTime: z.string().nullable().optional(),
      })
      .parse(input);
    return makeResult("simulated_leave_request_created", DEMO_READONLY_MESSAGE, {
      leaveType: payload.leaveType,
      startDate: payload.startDate,
      endDate: payload.endDate,
      durationMode: payload.durationMode ?? "full_day",
      partialStartTime: payload.partialStartTime ?? null,
      partialEndTime: payload.partialEndTime ?? null,
      simulatedAt: timestamp(),
    });
  }

  const payload = z.object({ leaveRequestId: z.string() }).parse(input);
  return makeResult("simulated_leave_request_cancelled", DEMO_READONLY_MESSAGE, {
    leaveRequestId: payload.leaveRequestId,
    simulatedAt: timestamp(),
  });
}

export function simulateCorrectionAction(kind: string, input: unknown) {
  if (kind === "createTimeEntryChangeRequest") {
    const payload = z
      .object({
        timeEntryId: z.string(),
        reason: z.string(),
        proposedProjectId: z.string().nullable().optional(),
      })
      .parse(input);
    return makeResult(
      "simulated_correction_request_created",
      DEMO_READONLY_MESSAGE,
      {
        timeEntryId: payload.timeEntryId,
        reason: payload.reason,
        proposedProjectId: payload.proposedProjectId ?? null,
        simulatedAt: timestamp(),
      }
    );
  }

  const payload = z.object({ changeRequestId: z.string() }).parse({ changeRequestId: input });
  return makeResult("simulated_correction_request_withdrawn", DEMO_READONLY_MESSAGE, {
    changeRequestId: payload.changeRequestId,
    simulatedAt: timestamp(),
  });
}

export function simulateAdminAction(kind: string, input: unknown) {
  return makeResult(`simulated_${kind}`, DEMO_READONLY_MESSAGE, {
    input: typeof input === "object" && input ? input : { value: input ?? null },
    simulatedAt: timestamp(),
  });
}

export function simulateExportAction(input: unknown) {
  const payload = z
    .object({
      exportType: z.string(),
      dateFrom: z.string(),
      dateTo: z.string(),
      employeeId: z.string().nullable().optional(),
      teamId: z.string().nullable().optional(),
      projectId: z.string().nullable().optional(),
    })
    .parse(input);

  return makeResult("simulated_export_started", DEMO_EXPORT_MESSAGE, {
    exportType: payload.exportType,
    dateFrom: payload.dateFrom,
    dateTo: payload.dateTo,
    employeeId: payload.employeeId ?? null,
    teamId: payload.teamId ?? null,
    projectId: payload.projectId ?? null,
    simulatedAt: timestamp(),
  });
}
