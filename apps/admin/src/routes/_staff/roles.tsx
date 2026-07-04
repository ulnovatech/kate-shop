import { createFileRoute } from "@tanstack/react-router";
import { RolesPage } from "@/components/admin/roles/roles-page";

export const Route = createFileRoute("/_staff/roles")({
  staticData: { adminPermission: "roles" as const },
  component: AdminRoles,
});

function AdminRoles() {
  return <RolesPage />;
}
