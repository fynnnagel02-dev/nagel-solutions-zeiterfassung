import { AdminReportsScreen } from "@/src/screens/admin/AdminReportsScreen";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    employeeId?: string;
    year?: string;
    month?: string;
  }>;
}) {
  return AdminReportsScreen({ searchParams });
}
