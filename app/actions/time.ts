"use server";

import { isDemoModeActive } from "@/src/lib/demo/action-guard";
import { simulateTimeAction } from "@/src/lib/demo/simulations";
import * as mutation from "@/src/lib/db/mutations/time";

export async function startWorkday(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateTimeAction("startWorkday", input);
  }
  return mutation.startWorkday(input);
}

export async function startBreak(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateTimeAction("startBreak", input);
  }
  return mutation.startBreak(input);
}

export async function endBreak(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateTimeAction("endBreak", input);
  }
  return mutation.endBreak(input);
}

export async function endWorkday(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateTimeAction("endWorkday", input);
  }
  return mutation.endWorkday(input);
}

export async function saveManualTimeEntry(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateTimeAction("saveManualTimeEntry", input);
  }
  return mutation.saveManualTimeEntry(input);
}

export async function updateEditableTimeEntry(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateTimeAction("updateEditableTimeEntry", input);
  }
  return mutation.updateEditableTimeEntry(input);
}

export async function submitTimeEntryForApproval(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateTimeAction("submitTimeEntryForApproval", input);
  }
  return mutation.submitTimeEntryForApproval(input);
}

export async function reopenTimeEntry(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateTimeAction("reopenTimeEntry", input);
  }
  return mutation.reopenTimeEntry(input);
}
