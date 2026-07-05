import { createFileRoute } from "@tanstack/react-router";
import { StaffJoinPage } from "@/components/admin/onboarding";

export const Route = createFileRoute("/_staff/join")({
  staticData: { adminRouteHeading: "Join your team" as const },
  component: AdminJoin,
});

function AdminJoin() {
  return <StaffJoinPage />;
}
