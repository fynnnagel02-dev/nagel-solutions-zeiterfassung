import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin-client";

type AuditPayload = {
  timeEntryId: string;
  actorProfileId: string | null;
  actorEmployeeId: string | null;
  eventType: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
};

export async function logTimeEntryAuditEvent(payload: AuditPayload) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("time_entry_audit_logs").insert({
    time_entry_id: payload.timeEntryId,
    actor_profile_id: payload.actorProfileId,
    actor_employee_id: payload.actorEmployeeId,
    event_type: payload.eventType,
    old_values: payload.oldValues ?? null,
    new_values: payload.newValues ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}
