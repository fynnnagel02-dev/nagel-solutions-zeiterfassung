"use server";

import { revalidatePath } from "next/cache";

import * as timeMutation from "@/src/lib/db/mutations/time";
import * as correctionMutation from "@/src/lib/db/mutations/corrections";
import * as leaveMutation from "@/src/lib/db/mutations/leave";

function revalidateOperationalViews() {
  revalidatePath("/team/freigaben");
  revalidatePath("/verwaltung/steuerung/freigaben");
  revalidatePath("/team/kalender");
  revalidatePath("/verwaltung/steuerung/kalender");
}

export async function approveTimeEntry(timeEntryId: string, reason?: string) {
  const result = await timeMutation.approveTimeEntry(timeEntryId, reason);
  revalidateOperationalViews();
  return result;
}

export async function rejectTimeEntry(timeEntryId: string, reason?: string) {
  const result = await timeMutation.rejectTimeEntry(timeEntryId, reason);
  revalidateOperationalViews();
  return result;
}

export async function createTimeEntryChangeRequest(input: unknown) {
  return correctionMutation.createTimeEntryChangeRequest(input);
}

export async function withdrawTimeEntryChangeRequest(changeRequestId: string) {
  return correctionMutation.withdrawTimeEntryChangeRequest(changeRequestId);
}

export async function approveTimeEntryChangeRequest(input: unknown) {
  const result = await correctionMutation.approveTimeEntryChangeRequest(input);
  revalidateOperationalViews();
  return result;
}

export async function rejectTimeEntryChangeRequest(input: unknown) {
  const result = await correctionMutation.rejectTimeEntryChangeRequest(input);
  revalidateOperationalViews();
  return result;
}

export async function approveLeaveRequest(input: unknown) {
  const result = await leaveMutation.approveLeaveRequest(input);
  revalidateOperationalViews();
  return result;
}

export async function rejectLeaveRequest(input: unknown) {
  const result = await leaveMutation.rejectLeaveRequest(input);
  revalidateOperationalViews();
  return result;
}
