import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";

export async function isHoliday(date: string) {
  const admin = createSupabaseAdminClient();
  const { data: settings, error: settingsError } = await admin
    .from("company_settings")
    .select("holiday_region_code")
    .eq("id", 1)
    .single();

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  const { data, error } = await admin
    .from("holidays")
    .select("id")
    .eq("holiday_date", date)
    .eq("region_code", settings.holiday_region_code)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}
