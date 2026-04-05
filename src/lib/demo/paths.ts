import type { AppRole } from "@/src/lib/types/domain";

export const DEMO_MODE_COOKIE = "ns_demo_mode";
export const DEMO_ROLE_COOKIE = "ns_demo_role";
export const DEMO_EMBED_COOKIE = "ns_demo_embed";

export type AppHrefRuntime = {
  isDemo: boolean;
  role: AppRole;
  embed: boolean;
  basePath: string;
};

function normalizePath(path: string) {
  if (!path || path === "/") {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

export function getDefaultPathForRole(role: AppRole) {
  if (role === "admin") {
    return "/verwaltung/uebersicht";
  }

  if (role === "team_lead") {
    return "/team/heute";
  }

  return "/heute";
}

export function buildAppHref(path: string, runtime: AppHrefRuntime) {
  const normalizedPath = normalizePath(path);

  if (!runtime.isDemo) {
    return normalizedPath;
  }

  const params = new URLSearchParams();
  params.set("role", runtime.role);
  if (runtime.embed) {
    params.set("embed", "true");
  }

  const href = `${runtime.basePath}${normalizedPath === "/" ? "" : normalizedPath}`;
  const query = params.toString();
  return query ? `${href}?${query}` : href;
}
