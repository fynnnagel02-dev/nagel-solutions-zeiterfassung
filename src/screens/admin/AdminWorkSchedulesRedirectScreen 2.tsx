import { redirect } from "next/navigation";

import { buildAppHref } from "@/src/lib/demo/paths";
import { getAppRuntimeState } from "@/src/lib/demo/runtime";

export async function AdminWorkSchedulesRedirectScreen() {
  const runtime = await getAppRuntimeState();
  redirect(buildAppHref("/verwaltung/einstellungen", runtime));
}
