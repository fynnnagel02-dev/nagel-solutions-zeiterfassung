import { AdminCalendarScreen } from "@/src/screens/admin/AdminCalendarScreen";

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
    teamId?: string;
  }>;
}) {
  return AdminCalendarScreen({ searchParams });
}
