import "server-only";

import { cache } from "react";

import { AuthenticationError, NotFoundError } from "@/src/lib/security/errors";
import { getDemoSessionContext } from "@/src/lib/demo/session";
import { getAppRuntimeState } from "@/src/lib/demo/runtime";
import { createSupabaseServerClient } from "@/src/lib/supabase/server-client";
import type { SessionContext } from "@/src/lib/types/domain";

export const getCurrentSessionContext = cache(async (): Promise<SessionContext> => {
  const runtime = await getAppRuntimeState();

  if (runtime.isDemo) {
    return getDemoSessionContext(runtime.role);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthenticationError();
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new NotFoundError("Profile is missing for the current user");
  }

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select(
      "id, team_id, work_schedule_id, is_active, target_daily_minutes_override, target_weekly_minutes_override"
    )
    .eq("profile_id", user.id)
    .maybeSingle();

  if (employeeError) {
    throw new Error(employeeError.message);
  }

  return {
    authUserId: user.id,
    profile: {
      id: profile.id,
      role: profile.role,
      isActive: profile.is_active,
    },
    employee: employee
      ? {
          id: employee.id,
          teamId: employee.team_id,
          workScheduleId: employee.work_schedule_id,
          isActive: employee.is_active,
          targetDailyMinutesOverride: employee.target_daily_minutes_override,
          targetWeeklyMinutesOverride: employee.target_weekly_minutes_override,
        }
      : null,
    runtime: {
      mode: "real",
      basePath: "",
      role: profile.role,
      embed: false,
    },
  };
});
