import type { AppRole } from "@/src/lib/types/domain";

export const ROLE_ORDER: AppRole[] = ["employee", "team_lead", "admin"];

export function isAdmin(role: AppRole) {
  return role === "admin";
}

export function isTeamLead(role: AppRole) {
  return role === "team_lead" || role === "admin";
}
