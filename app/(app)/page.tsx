import { redirect } from "next/navigation";

import { requireAppSession } from "@/src/lib/auth/route-guards";

export default async function AppRootPage() {
  const context = await requireAppSession();

  if (context.profile.role === "admin") {
    redirect("/verwaltung/uebersicht");
  }

  if (context.profile.role === "team_lead") {
    redirect("/team/heute");
  }

  redirect("/heute");
}
