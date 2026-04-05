import "server-only";

import { z } from "zod";

export type DemoActionResult<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  ok: true;
  simulated: true;
  kind: string;
  message: string;
  payload: TPayload;
};

function timestamp() {
  return new Date().toISOString();
}

function makeResult<TPayload extends Record<string, unknown>>(
  kind: string,
  message: string,
  payload: TPayload
): DemoActionResult<TPayload> {
  return {
    ok: true,
    simulated: true,
    kind,
    message,
    payload,
  };
}

export function simulateTimeAction(kind: string, input: unknown) {
  if (kind === "startWorkday") {
    const payload = z
      .object({ entryDate: z.string(), startedAt: z.string(), projectId: z.string() })
      .parse(input);
    return makeResult("simulated_workday_started", "Demo-Modus: Arbeitsbeginn wurde simuliert.", {
      entryDate: payload.entryDate,
      startedAt: payload.startedAt,
      projectId: payload.projectId,
      simulatedAt: timestamp(),
    });
  }

  if (kind === "startBreak") {
    const payload = z.object({ timeEntryId: z.string(), startedAt: z.string() }).parse(input);
    return makeResult("simulated_break_started", "Demo-Modus: Pausenbeginn wurde simuliert.", {
      timeEntryId: payload.timeEntryId,
      startedAt: payload.startedAt,
      simulatedAt: timestamp(),
    });
  }

  if (kind === "endBreak") {
    const payload = z.object({ timeEntryId: z.string(), endedAt: z.string() }).parse(input);
    return makeResult("simulated_break_ended", "Demo-Modus: Pausenende wurde simuliert.", {
      timeEntryId: payload.timeEntryId,
      endedAt: payload.endedAt,
      simulatedAt: timestamp(),
    });
  }

  if (kind === "endWorkday") {
    const payload = z.object({ timeEntryId: z.string(), endedAt: z.string() }).parse(input);
    return makeResult("simulated_workday_ended", "Demo-Modus: Arbeitsende wurde simuliert.", {
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
    return makeResult("simulated_time_entry_saved", "Demo-Modus: Zeiteintrag wurde simuliert gespeichert.", {
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
    return makeResult("simulated_time_entry_reopened", "Demo-Modus: Wiederoeffnung des Zeiteintrags wurde simuliert.", {
      timeEntryId: payload.timeEntryId,
      reason: payload.reason ?? null,
      simulatedAt: timestamp(),
    });
  }

  const payload = z.object({ timeEntryId: z.string() }).parse(input);
  return makeResult("simulated_time_entry_submitted", "Demo-Modus: Zeiteintrag wurde simuliert eingereicht.", {
    timeEntryId: payload.timeEntryId,
    simulatedAt: timestamp(),
  });
}

export function simulateApprovalAction(kind: string, input: unknown) {
  if (kind === "approveTimeEntry" || kind === "rejectTimeEntry") {
    const payload = z.object({ timeEntryId: z.string(), reason: z.string().optional() }).parse(input);
    return makeResult(
      kind === "approveTimeEntry" ? "simulated_time_entry_approved" : "simulated_time_entry_rejected",
      kind === "approveTimeEntry"
        ? "Demo-Modus: Zeitfreigabe wurde simuliert."
        : "Demo-Modus: Zeitablehnung wurde simuliert.",
      { timeEntryId: payload.timeEntryId, reason: payload.reason ?? null, simulatedAt: timestamp() }
    );
  }

  if (kind === "approveLeaveRequest" || kind === "rejectLeaveRequest") {
    const payload = z.object({ leaveRequestId: z.string(), reason: z.string().nullable().optional() }).parse(input);
    return makeResult(
      kind === "approveLeaveRequest" ? "simulated_leave_request_approved" : "simulated_leave_request_rejected",
      kind === "approveLeaveRequest"
        ? "Demo-Modus: Abwesenheit wurde simuliert genehmigt."
        : "Demo-Modus: Abwesenheit wurde simuliert abgelehnt.",
      { leaveRequestId: payload.leaveRequestId, reason: payload.reason ?? null, simulatedAt: timestamp() }
    );
  }

  const payload = z.object({ changeRequestId: z.string(), reason: z.string().nullable().optional() }).parse(input);
  return makeResult(
    kind === "approveTimeEntryChangeRequest"
      ? "simulated_correction_request_approved"
      : "simulated_correction_request_rejected",
    kind === "approveTimeEntryChangeRequest"
      ? "Demo-Modus: Korrektur wurde simuliert freigegeben."
      : "Demo-Modus: Korrektur wurde simuliert abgelehnt.",
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
    return makeResult("simulated_leave_request_created", "Demo-Modus: Abwesenheitsantrag wurde simuliert erstellt.", {
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
  return makeResult("simulated_leave_request_cancelled", "Demo-Modus: Stornierung wurde simuliert.", {
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
      "Demo-Modus: Korrekturanfrage wurde simuliert eingereicht.",
      {
        timeEntryId: payload.timeEntryId,
        reason: payload.reason,
        proposedProjectId: payload.proposedProjectId ?? null,
        simulatedAt: timestamp(),
      }
    );
  }

  const payload = z.object({ changeRequestId: z.string() }).parse({ changeRequestId: input });
  return makeResult("simulated_correction_request_withdrawn", "Demo-Modus: Rückzug der Korrektur wurde simuliert.", {
    changeRequestId: payload.changeRequestId,
    simulatedAt: timestamp(),
  });
}

export function simulateAdminAction(kind: string, input: unknown) {
  const messages: Record<string, string> = {
    employee_created: "Demo-Modus: Mitarbeitende Person wurde simuliert angelegt.",
    employee_updated: "Demo-Modus: Mitarbeitendenprofil wurde simuliert aktualisiert.",
    employee_deactivated: "Demo-Modus: Deaktivierung wurde simuliert.",
    team_created: "Demo-Modus: Team wurde simuliert angelegt.",
    team_updated: "Demo-Modus: Teamaenderung wurde simuliert.",
    team_archived: "Demo-Modus: Teamarchivierung wurde simuliert.",
    team_lead_assigned: "Demo-Modus: Teamleitung wurde simuliert zugewiesen.",
    work_schedule_created: "Demo-Modus: Arbeitszeitmodell wurde simuliert angelegt.",
    work_schedule_updated: "Demo-Modus: Arbeitszeitmodell wurde simuliert aktualisiert.",
    company_settings_updated: "Demo-Modus: Unternehmenseinstellungen wurden simuliert gespeichert.",
    project_created: "Demo-Modus: Projekt wurde simuliert angelegt.",
    project_updated: "Demo-Modus: Projekt wurde simuliert aktualisiert.",
    project_archived: "Demo-Modus: Projektarchivierung wurde simuliert.",
    holiday_created: "Demo-Modus: Feiertag wurde simuliert angelegt.",
    holiday_updated: "Demo-Modus: Feiertag wurde simuliert aktualisiert.",
    holiday_deleted: "Demo-Modus: Feiertag wurde simuliert geloescht.",
  };

  return makeResult(`simulated_${kind}`, messages[kind] ?? "Demo-Modus: Verwaltungsaktion wurde simuliert.", {
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

  return makeResult("simulated_export_started", "Demo-Modus: PDF-Export wurde simuliert vorbereitet.", {
    exportType: payload.exportType,
    dateFrom: payload.dateFrom,
    dateTo: payload.dateTo,
    employeeId: payload.employeeId ?? null,
    teamId: payload.teamId ?? null,
    projectId: payload.projectId ?? null,
    simulatedAt: timestamp(),
  });
}
