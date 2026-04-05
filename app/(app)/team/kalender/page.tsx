import { TeamCalendarScreen } from "@/src/screens/team/TeamCalendarScreen";

export default async function TeamCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}) {
  return TeamCalendarScreen({ searchParams });
}
