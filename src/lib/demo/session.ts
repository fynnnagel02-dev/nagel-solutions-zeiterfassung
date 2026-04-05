import "server-only";

import type { AppRole, SessionContext } from "@/src/lib/types/domain";
import type { AppRuntimeState } from "@/src/lib/demo/runtime";
import { getAppRuntimeState } from "@/src/lib/demo/runtime";

export const DEMO_IDS = {
  profiles: {
    admin: "10000000-0000-0000-0000-000000000001",
    teamLead: "10000000-0000-0000-0000-000000000002",
    employee: "10000000-0000-0000-0000-000000000003",
    fieldOne: "10000000-0000-0000-0000-000000000004",
    fieldTwo: "10000000-0000-0000-0000-000000000005",
    fieldThree: "10000000-0000-0000-0000-000000000006",
  },
  employees: {
    admin: "20000000-0000-0000-0000-000000000001",
    teamLead: "20000000-0000-0000-0000-000000000002",
    employee: "20000000-0000-0000-0000-000000000003",
    fieldOne: "20000000-0000-0000-0000-000000000004",
    fieldTwo: "20000000-0000-0000-0000-000000000005",
    fieldThree: "20000000-0000-0000-0000-000000000006",
  },
  teams: {
    operations: "30000000-0000-0000-0000-000000000001",
    service: "30000000-0000-0000-0000-000000000002",
  },
  workSchedules: {
    standard: "40000000-0000-0000-0000-000000000001",
    field: "40000000-0000-0000-0000-000000000002",
  },
  projects: {
    retrofit: "50000000-0000-0000-0000-000000000001",
    rollout: "50000000-0000-0000-0000-000000000002",
    support: "50000000-0000-0000-0000-000000000003",
  },
} as const;

function getEmployeeContext(role: AppRole) {
  if (role === "admin") {
    return {
      id: DEMO_IDS.employees.admin,
      teamId: DEMO_IDS.teams.operations,
      workScheduleId: DEMO_IDS.workSchedules.standard,
    };
  }

  if (role === "team_lead") {
    return {
      id: DEMO_IDS.employees.teamLead,
      teamId: DEMO_IDS.teams.operations,
      workScheduleId: DEMO_IDS.workSchedules.standard,
    };
  }

  return {
    id: DEMO_IDS.employees.employee,
    teamId: DEMO_IDS.teams.operations,
    workScheduleId: DEMO_IDS.workSchedules.field,
  };
}

const DEMO_EMPLOYEE_NAMES: Record<AppRole, string> = {
  admin: "Petra Nagel",
  team_lead: "Markus Weber",
  employee: "Lena Hoffmann",
};

function getProfileId(role: AppRole) {
  if (role === "admin") {
    return DEMO_IDS.profiles.admin;
  }

  if (role === "team_lead") {
    return DEMO_IDS.profiles.teamLead;
  }

  return DEMO_IDS.profiles.employee;
}

export function getDemoEmployeeName(role: AppRole) {
  return DEMO_EMPLOYEE_NAMES[role];
}

export async function getDemoSessionContext(
  role: AppRole,
  runtimeOverride?: AppRuntimeState
): Promise<SessionContext> {
  const runtime = runtimeOverride ?? (await getAppRuntimeState());
  const employee = getEmployeeContext(role);

  return {
    authUserId: getProfileId(role),
    profile: {
      id: getProfileId(role),
      role,
      isActive: true,
    },
    employee: {
      id: employee.id,
      teamId: employee.teamId,
      workScheduleId: employee.workScheduleId,
      isActive: true,
      targetDailyMinutesOverride: null,
      targetWeeklyMinutesOverride: null,
    },
    runtime: {
      mode: "demo",
      basePath: runtime.basePath,
      role,
      embed: runtime.embed,
    },
  };
}
