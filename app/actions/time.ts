"use server";

import * as mutation from "@/src/lib/db/mutations/time";

export async function startWorkday(input: unknown) {
  return mutation.startWorkday(input);
}

export async function startBreak(input: unknown) {
  return mutation.startBreak(input);
}

export async function endBreak(input: unknown) {
  return mutation.endBreak(input);
}

export async function endWorkday(input: unknown) {
  return mutation.endWorkday(input);
}

export async function saveManualTimeEntry(input: unknown) {
  return mutation.saveManualTimeEntry(input);
}

export async function updateEditableTimeEntry(input: unknown) {
  return mutation.updateEditableTimeEntry(input);
}

export async function submitTimeEntryForApproval(input: unknown) {
  return mutation.submitTimeEntryForApproval(input);
}

export async function reopenTimeEntry(input: unknown) {
  return mutation.reopenTimeEntry(input);
}
