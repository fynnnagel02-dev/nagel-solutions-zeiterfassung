import { ConflictError } from "@/src/lib/security/errors";
import type { TimeEntryBreakRow, TimeEntryRow } from "@/src/lib/types/domain";

const MINUTE_MS = 60_000;

export function diffMinutes(startIso: string, endIso: string) {
  return Math.max(0, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / MINUTE_MS));
}

export function computeBreakMinutes(breaks: Pick<TimeEntryBreakRow, "started_at" | "ended_at">[]) {
  return breaks.reduce((total, currentBreak) => {
    if (!currentBreak.ended_at) {
      return total;
    }

    return total + diffMinutes(currentBreak.started_at, currentBreak.ended_at);
  }, 0);
}

export function computeWorkedMinutes(entry: Pick<TimeEntryRow, "started_at" | "ended_at">, breaks: Pick<TimeEntryBreakRow, "started_at" | "ended_at">[]) {
  if (!entry.started_at || !entry.ended_at) {
    return 0;
  }

  return Math.max(0, diffMinutes(entry.started_at, entry.ended_at) - computeBreakMinutes(breaks));
}

export function createSyntheticManualBreak(startedAt: string, endedAt: string, breakMinutes: number) {
  if (breakMinutes <= 0) {
    return null;
  }

  const endTime = new Date(endedAt).getTime();
  const breakEnd = new Date(endTime).toISOString();
  const breakStart = new Date(endTime - breakMinutes * MINUTE_MS).toISOString();

  if (new Date(breakStart).getTime() < new Date(startedAt).getTime()) {
    throw new ConflictError("Break duration exceeds the manual work interval");
  }

  return {
    started_at: breakStart,
    ended_at: breakEnd,
    source: "manual" as const,
  };
}

export function assertNoOpenBreak(breaks: Pick<TimeEntryBreakRow, "ended_at">[]) {
  if (breaks.some((currentBreak) => !currentBreak.ended_at)) {
    throw new ConflictError("An open break already exists");
  }
}
