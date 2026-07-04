import { createFileRoute } from "@tanstack/react-router";
import { RecycleListPage } from "@/components/admin/recycle";

export const Route = createFileRoute("/admin/recycle")({
  staticData: { adminPermission: "catalog" as const, adminRouteHeading: "Recycle bin" as const },
  component: AdminRecycle,
});

function AdminRecycle() {
  return <RecycleListPage />;
}
