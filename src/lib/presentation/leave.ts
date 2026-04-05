import type { LeaveDurationMode, LeaveType } from "@/src/lib/types/domain";

export function getLeaveTypeLabel(leaveType: LeaveType) {
  switch (leaveType) {
    case "vacation":
      return "Urlaub";
    case "sick":
      return "Krank";
    case "medical":
      return "Arzt Besuch";
    default:
      return "Sonstiges";
  }
}

export function getLeaveDurationSummary(input: {
  durationMode?: LeaveDurationMode | null;
  partialStartTime?: string | null;
  partialEndTime?: string | null;
  startDayPart?: "full" | "morning" | "afternoon" | null;
  endDayPart?: "full" | "morning" | "afternoon" | null;
}) {
  if (
    input.durationMode === "partial_day" &&
    input.partialStartTime &&
    input.partialEndTime
  ) {
    return `Halbtags, ${input.partialStartTime} - ${input.partialEndTime}`;
  }

  if (
    input.startDayPart &&
    input.endDayPart &&
    (input.startDayPart !== "full" || input.endDayPart !== "full")
  ) {
    return "Halbtags";
  }

  return "Ganzer Tag";
}
