import { createFileRoute } from "@tanstack/react-router";
import { RolesPage } from "@/components/admin/roles/roles-page";

export const Route = createFileRoute("/admin/roles")({
  staticData: { adminPermission: "roles" as const, adminRouteHeading: "Roles" as const },
  component: AdminRoles,
});

function AdminRoles() {
  return <RolesPage />;
}
