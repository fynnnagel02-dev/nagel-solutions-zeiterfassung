import "server-only";

import { getAppRuntimeState } from "@/src/lib/demo/runtime";

export async function isDemoModeActive() {
  const runtime = await getAppRuntimeState();
  return runtime.isDemo;
}
