import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";

import {
  DEMO_EMBED_COOKIE,
  DEMO_MODE_COOKIE,
  DEMO_ROLE_COOKIE,
} from "@/src/lib/demo/paths";
import type { AppRole } from "@/src/lib/types/domain";

const VALID_ROLES: AppRole[] = ["employee", "team_lead", "admin"];

export type AppRuntimeState = {
  isDemo: boolean;
  role: AppRole;
  embed: boolean;
  basePath: string;
  showRoleSwitcher: boolean;
};

function isAppRole(value: string | null | undefined): value is AppRole {
  return Boolean(value && VALID_ROLES.includes(value as AppRole));
}

function parseBooleanFlag(value: string | null | undefined) {
  return value === "1" || value === "true";
}

function buildRuntimeState(input: {
  isDemo: boolean;
  role: AppRole;
  embed: boolean;
  basePath?: string;
}) {
  const basePath = input.isDemo ? input.basePath ?? "/demo" : "";

  return {
    isDemo: input.isDemo,
    role: input.role,
    embed: input.embed,
    basePath,
    showRoleSwitcher: input.isDemo && !input.embed,
  } satisfies AppRuntimeState;
}

export function resolveDemoRuntimeFromRequest(input: {
  pathname?: string;
  searchParams?: Record<string, string | string[] | undefined>;
  fallbackRole?: string | null;
  fallbackEmbed?: string | null;
}): AppRuntimeState {
  const searchParams = input.searchParams ?? {};
  const roleValue = typeof searchParams.role === "string" ? searchParams.role : input.fallbackRole;
  const embedValue =
    typeof searchParams.embed === "string" ? searchParams.embed : input.fallbackEmbed;
  const role = isAppRole(roleValue) ? roleValue : "employee";
  const embed = parseBooleanFlag(embedValue);

  return buildRuntimeState({
    isDemo: true,
    role,
    embed,
    basePath: input.pathname?.startsWith("/demo") ? "/demo" : "/demo",
  });
}

export const getAppRuntimeState = cache(async (): Promise<AppRuntimeState> => {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);
  const headerDemoMode = headerStore.get("x-demo-mode");
  const cookieDemoMode = cookieStore.get(DEMO_MODE_COOKIE)?.value;
  const isDemo = parseBooleanFlag(headerDemoMode ?? cookieDemoMode);

  const headerRole = headerStore.get("x-demo-role");
  const cookieRole = cookieStore.get(DEMO_ROLE_COOKIE)?.value;
  const role = isAppRole(headerRole) ? headerRole : isAppRole(cookieRole) ? cookieRole : "employee";

  const headerEmbed = headerStore.get("x-demo-embed");
  const cookieEmbed = cookieStore.get(DEMO_EMBED_COOKIE)?.value;
  const embed = parseBooleanFlag(headerEmbed ?? cookieEmbed);

  return buildRuntimeState({
    isDemo,
    role,
    embed,
  });
});
