import { ConflictError } from "@/src/lib/security/errors";
import type { TimeEntryBreakRow, TimeEntryRow } from "@/src/lib/types/domain";

const MINUTE_MS = 60_000;
const LEGAL_BREAK_BLOCK_MINUTES = 15;

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

export function computeCreditableBreakMinutes(
  breaks: Pick<TimeEntryBreakRow, "started_at" | "ended_at">[]
) {
  return breaks.reduce((total, currentBreak) => {
    if (!currentBreak.ended_at) {
      return total;
    }

    const durationMinutes = diffMinutes(currentBreak.started_at, currentBreak.ended_at);
    return durationMinutes >= LEGAL_BREAK_BLOCK_MINUTES ? total + durationMinutes : total;
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

export function getRequiredLegalBreakMinutes(workIntervalMinutes: number) {
  if (workIntervalMinutes > 9 * 60) {
    return 45;
  }

  if (workIntervalMinutes > 6 * 60) {
    return 30;
  }

  return 0;
}

export function getAdditionalAutoLegalBreakMinutes(input: {
  startedAt: string;
  endedAt: string;
  breaks: Pick<TimeEntryBreakRow, "started_at" | "ended_at">[];
}) {
  const workIntervalMinutes = diffMinutes(input.startedAt, input.endedAt);
  const requiredMinutes = getRequiredLegalBreakMinutes(workIntervalMinutes);

  if (requiredMinutes === 0) {
    return 0;
  }

  const creditedMinutes = computeCreditableBreakMinutes(input.breaks);
  if (creditedMinutes >= requiredMinutes) {
    return 0;
  }

  const missingMinutes = requiredMinutes - creditedMinutes;
  return missingMinutes < LEGAL_BREAK_BLOCK_MINUTES
    ? LEGAL_BREAK_BLOCK_MINUTES
    : missingMinutes;
}

export function findAutoLegalBreakWindow(input: {
  startedAt: string;
  endedAt: string;
  breakMinutes: number;
  existingBreaks: Pick<TimeEntryBreakRow, "started_at" | "ended_at">[];
}) {
  const durationMs = input.breakMinutes * MINUTE_MS;
  const workStartMs = new Date(input.startedAt).getTime();
  let cursorEndMs = new Date(input.endedAt).getTime();
  const closedBreaks = input.existingBreaks
    .filter((item) => item.ended_at)
    .map((item) => ({
      startedAtMs: new Date(item.started_at).getTime(),
      endedAtMs: new Date(item.ended_at as string).getTime(),
    }))
    .sort((left, right) => right.startedAtMs - left.startedAtMs);

  for (const currentBreak of closedBreaks) {
    if (currentBreak.startedAtMs >= cursorEndMs) {
      continue;
    }

    if (currentBreak.endedAtMs <= cursorEndMs && cursorEndMs - currentBreak.endedAtMs >= durationMs) {
      return {
        startedAt: new Date(cursorEndMs - durationMs).toISOString(),
        endedAt: new Date(cursorEndMs).toISOString(),
      };
    }

    cursorEndMs = Math.min(cursorEndMs, currentBreak.startedAtMs);
  }

  if (cursorEndMs - workStartMs >= durationMs) {
    return {
      startedAt: new Date(cursorEndMs - durationMs).toISOString(),
      endedAt: new Date(cursorEndMs).toISOString(),
    };
  }

  throw new ConflictError("Legal break cannot be placed inside the recorded work interval");
}

export function assertNoOpenBreak(breaks: Pick<TimeEntryBreakRow, "ended_at">[]) {
  if (breaks.some((currentBreak) => !currentBreak.ended_at)) {
    throw new ConflictError("An open break already exists");
  }
}
