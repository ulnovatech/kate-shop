import { createFileRoute } from "@tanstack/react-router";
import { StaffAccountPage } from "@/components/admin/account";

export const Route = createFileRoute("/_staff/account")({
  staticData: { adminPermission: "account" as const, adminRouteHeading: "My account" as const },
  component: AdminAccount,
});

function AdminAccount() {
  return <StaffAccountPage />;
}
