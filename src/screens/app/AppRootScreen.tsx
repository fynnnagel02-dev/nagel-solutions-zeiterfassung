import { redirect } from "next/navigation";

import { requireAppSession } from "@/src/lib/auth/route-guards";
import { buildAppHref, getDefaultPathForRole } from "@/src/lib/demo/paths";
import type { AppRuntimeState } from "@/src/lib/demo/runtime";
import { getAppRuntimeState } from "@/src/lib/demo/runtime";

export async function AppRootScreen(runtimeOverride?: AppRuntimeState) {
  const runtime = runtimeOverride ?? (await getAppRuntimeState());

  if (runtime.isDemo) {
    redirect(buildAppHref(getDefaultPathForRole(runtime.role), runtime));
  }

  const context = await requireAppSession();
  redirect(buildAppHref(getDefaultPathForRole(context.profile.role), runtime));
}
