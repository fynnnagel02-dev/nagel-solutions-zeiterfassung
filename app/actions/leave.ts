"use server";

import { revalidatePath } from "next/cache";

import { isDemoModeActive } from "@/src/lib/demo/action-guard";
import { simulateLeaveAction } from "@/src/lib/demo/simulations";
import * as mutation from "@/src/lib/db/mutations/leave";

function revalidateLeaveViews() {
  revalidatePath("/abwesenheiten");
  revalidatePath("/team/kalender");
  revalidatePath("/verwaltung/steuerung/kalender");
  revalidatePath("/team/freigaben");
  revalidatePath("/verwaltung/steuerung/freigaben");
}

export async function createLeaveRequest(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateLeaveAction("createLeaveRequest", input);
  }
  const result = await mutation.createLeaveRequest(input);
  revalidateLeaveViews();
  return result;
}

export async function cancelLeaveRequest(input: unknown) {
  if (await isDemoModeActive()) {
    return simulateLeaveAction("cancelLeaveRequest", input);
  }
  const result = await mutation.cancelLeaveRequest(input);
  revalidateLeaveViews();
  return result;
}
