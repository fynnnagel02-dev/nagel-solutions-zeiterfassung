import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";
import type { SessionContext } from "@/src/lib/types/domain";

export async function getManagedEmployeeIds(context: SessionContext) {
  if (!context.employee) {
    return [];
  }

  if (context.profile.role === "admin") {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.from("employees").select("id").eq("is_active", true);
    if (error) {
      throw new Error(error.message);
    }
    return data.map((row) => row.id);
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("employees")
    .select("id")
    .eq("team_id", context.employee.teamId)
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  return data.map((row) => row.id);
}
