import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/src/components/app/AppShell";
import { getAppShellData } from "@/src/lib/app-shell-data";
import { getAppRuntimeState, resolveDemoRuntimeFromRequest } from "@/src/lib/demo/runtime";
import { AppRootScreen } from "@/src/screens/app/AppRootScreen";
import { AdminApprovalsScreen } from "@/src/screens/admin/AdminApprovalsScreen";
import { AdminCalendarScreen } from "@/src/screens/admin/AdminCalendarScreen";
import { AdminEmployeesScreen } from "@/src/screens/admin/AdminEmployeesScreen";
import { AdminExportsScreen } from "@/src/screens/admin/AdminExportsScreen";
import { AdminHolidaysScreen } from "@/src/screens/admin/AdminHolidaysScreen";
import { AdminOverviewScreen } from "@/src/screens/admin/AdminOverviewScreen";
import { AdminProjectsScreen } from "@/src/screens/admin/AdminProjectsScreen";
import { AdminReportsScreen } from "@/src/screens/admin/AdminReportsScreen";
import { AdminSettingsScreen } from "@/src/screens/admin/AdminSettingsScreen";
import { AdminTeamsScreen } from "@/src/screens/admin/AdminTeamsScreen";
import { AdminWorkSchedulesRedirectScreen } from "@/src/screens/admin/AdminWorkSchedulesRedirectScreen";
import { CorrectionsScreen } from "@/src/screens/employee/CorrectionsScreen";
import { LeaveScreen } from "@/src/screens/employee/LeaveScreen";
import { TodayScreen } from "@/src/screens/employee/TodayScreen";
import { WeekScreen } from "@/src/screens/employee/WeekScreen";
import { TeamApprovalsScreen } from "@/src/screens/team/TeamApprovalsScreen";
import { TeamCalendarScreen } from "@/src/screens/team/TeamCalendarScreen";
import { TeamTodayScreen } from "@/src/screens/team/TeamTodayScreen";

type DemoSearchParams = Promise<Record<string, string | string[] | undefined>>;

function paramsToRecord(searchParams: Record<string, string | string[] | undefined>) {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      normalized[key] = value;
    } else if (Array.isArray(value) && value[0]) {
      normalized[key] = value[0];
    }
  }

  return normalized;
}

async function renderDemoScreen(
  key: string,
  normalizedSearchParams: Promise<Record<string, string>>
): Promise<ReactNode> {
  switch (key) {
    case "":
      return <>{await AppRootScreen()}</>;
    case "heute":
      return <>{await TodayScreen()}</>;
    case "woche":
      return <>{await WeekScreen()}</>;
    case "abwesenheiten":
      return <>{await LeaveScreen()}</>;
    case "korrekturen":
      return <>{await CorrectionsScreen()}</>;
    case "team/heute":
      return <>{await TeamTodayScreen()}</>;
    case "team/freigaben":
      return <>{await TeamApprovalsScreen()}</>;
    case "team/kalender":
      return <>{await TeamCalendarScreen({ searchParams: normalizedSearchParams })}</>;
    case "verwaltung/uebersicht":
      return <>{await AdminOverviewScreen()}</>;
    case "verwaltung/einstellungen":
      return <>{await AdminSettingsScreen()}</>;
    case "verwaltung/stammdaten/arbeitszeitmodelle":
      return <>{await AdminWorkSchedulesRedirectScreen()}</>;
    case "verwaltung/stammdaten/feiertage":
      return <>{await AdminHolidaysScreen()}</>;
    case "verwaltung/stammdaten/mitarbeitende":
      return <>{await AdminEmployeesScreen()}</>;
    case "verwaltung/stammdaten/projekte":
      return <>{await AdminProjectsScreen()}</>;
    case "verwaltung/stammdaten/teams":
      return <>{await AdminTeamsScreen()}</>;
    case "verwaltung/steuerung/auswertungen":
      return <>{await AdminReportsScreen({ searchParams: normalizedSearchParams })}</>;
    case "verwaltung/steuerung/exporte":
      return <>{await AdminExportsScreen()}</>;
    case "verwaltung/steuerung/freigaben":
      return <>{await AdminApprovalsScreen()}</>;
    case "verwaltung/steuerung/kalender":
      return <>{await AdminCalendarScreen({ searchParams: normalizedSearchParams })}</>;
    default:
      return notFound();
  }
}

export default async function DemoCatchAllPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: DemoSearchParams;
}): Promise<ReactNode> {
  const [{ slug = [] }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const normalizedParams = paramsToRecord(resolvedSearchParams);
  const normalizedSearchParams = Promise.resolve(normalizedParams);
  const key = slug.join("/");
  const fallbackRuntime = await getAppRuntimeState();
  const runtime = resolveDemoRuntimeFromRequest({
    pathname: `/demo${key ? `/${key}` : ""}`,
    searchParams: normalizedParams,
    fallbackRole: fallbackRuntime.role,
    fallbackEmbed: fallbackRuntime.embed ? "true" : "false",
  });

  if (key === "") {
    return AppRootScreen(runtime);
  }

  const { context, company, employeeName } = await getAppShellData(runtime);
  const content = await renderDemoScreen(key, normalizedSearchParams);

  return (
    <AppShell
      key={`${runtime.role}:${key}:${runtime.embed ? "embed" : "full"}`}
      role={context.profile.role}
      companyName={company.companyName}
      employeeName={employeeName}
      isDemo
      embed={runtime.embed}
      basePath={runtime.basePath}
      showRoleSwitcher={runtime.showRoleSwitcher}
    >
      {content}
    </AppShell>
  );
}
