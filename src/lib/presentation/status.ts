import type {
  ApprovalStatus,
  ChangeRequestStatus,
  LeaveStatus,
  TimeEntryStatus,
} from "@/src/lib/types/domain";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export type StatusPresentation = {
  label: string;
  tone: StatusTone;
};

export function getTimeEntryStatusPresentation(
  status: TimeEntryStatus,
  approvalStatus?: ApprovalStatus,
  hasOpenBreak?: boolean
): StatusPresentation {
  if (hasOpenBreak) {
    return { label: "In Pause", tone: "info" };
  }

  if (status === "open") {
    return { label: "Läuft", tone: "info" };
  }

  if (status === "complete" && approvalStatus === "not_submitted") {
    return { label: "Abgeschlossen", tone: "neutral" };
  }

  if (status === "in_review" || approvalStatus === "pending") {
    return { label: "Eingereicht", tone: "warning" };
  }

  if (status === "approved" || approvalStatus === "approved") {
    return { label: "Freigegeben", tone: "success" };
  }

  if (status === "rejected" || approvalStatus === "rejected") {
    return { label: "Abgelehnt", tone: "danger" };
  }

  if (status === "corrected") {
    return { label: "Korrigiert", tone: "success" };
  }

  return { label: "Offen", tone: "neutral" };
}

export function getLeaveStatusPresentation(status: LeaveStatus): StatusPresentation {
  switch (status) {
    case "approved":
      return { label: "Freigegeben", tone: "success" };
    case "rejected":
      return { label: "Abgelehnt", tone: "danger" };
    case "cancelled":
      return { label: "Storniert", tone: "neutral" };
    default:
      return { label: "Ausstehend", tone: "warning" };
  }
}

export function getChangeRequestStatusPresentation(
  status: ChangeRequestStatus
): StatusPresentation {
  switch (status) {
    case "approved":
      return { label: "Freigegeben", tone: "success" };
    case "rejected":
      return { label: "Abgelehnt", tone: "danger" };
    case "withdrawn":
      return { label: "Zurückgezogen", tone: "neutral" };
    default:
      return { label: "Korrektur angefragt", tone: "warning" };
  }
}

export function getPresencePresentation(input: {
  hasEntry: boolean;
  hasOpenBreak: boolean;
  hasActiveAbsence: boolean;
}) {
  if (input.hasActiveAbsence) {
    return { label: "Abwesend", tone: "warning" as const };
  }

  if (input.hasOpenBreak) {
    return { label: "In Pause", tone: "info" as const };
  }

  if (input.hasEntry) {
    return { label: "Aktiv", tone: "success" as const };
  }

  return { label: "Noch keine Buchung", tone: "neutral" as const };
}
