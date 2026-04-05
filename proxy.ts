import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  DEMO_EMBED_COOKIE,
  DEMO_MODE_COOKIE,
  DEMO_ROLE_COOKIE,
} from "@/src/lib/demo/paths";

const demoCookieOptions = {
  httpOnly: false,
  sameSite: "lax" as const,
  path: "/demo",
};

function isDemoPath(pathname: string) {
  return pathname === "/demo" || pathname.startsWith("/demo/");
}

function resolveRole(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("role") ?? request.cookies.get(DEMO_ROLE_COOKIE)?.value;
  return value === "admin" || value === "team_lead" || value === "employee" ? value : "employee";
}

function resolveEmbed(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("embed") ?? request.cookies.get(DEMO_EMBED_COOKIE)?.value;
  return value === "true" || value === "1";
}

export function proxy(request: NextRequest) {
  const { nextUrl } = request;

  if (nextUrl.searchParams.get("demo") === "true" && !isDemoPath(nextUrl.pathname)) {
    const target = new URL(`/demo${nextUrl.pathname === "/" ? "" : nextUrl.pathname}`, request.url);
    const role = nextUrl.searchParams.get("role");
    const embed = nextUrl.searchParams.get("embed");

    if (role) {
      target.searchParams.set("role", role);
    }

    if (embed) {
      target.searchParams.set("embed", embed);
    }

    return NextResponse.redirect(target);
  }

  if (!isDemoPath(nextUrl.pathname)) {
    return NextResponse.next();
  }

  const role = resolveRole(request);
  const embed = resolveEmbed(request);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-demo-mode", "1");
  requestHeaders.set("x-demo-role", role);
  requestHeaders.set("x-demo-embed", embed ? "1" : "0");

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.cookies.set(DEMO_MODE_COOKIE, "1", demoCookieOptions);
  response.cookies.set(DEMO_ROLE_COOKIE, role, demoCookieOptions);
  response.cookies.set(DEMO_EMBED_COOKIE, embed ? "1" : "0", demoCookieOptions);

  return response;
}

export const config = {
  matcher: ["/demo/:path*", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
