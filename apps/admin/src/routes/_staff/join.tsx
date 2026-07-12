import { createFileRoute } from "@tanstack/react-router";
import { StaffJoinPage } from "@/components/admin/onboarding";
import { StaffAuthHibernateGate } from "@/components/admin/onboarding/staff-auth-hibernate-gate";

export const Route = createFileRoute("/_staff/join")({
  staticData: { adminRouteHeading: "Join your team" as const },
  component: AdminJoin,
});

function AdminJoin() {
  return (
    <StaffAuthHibernateGate>
      <StaffJoinPage />
    </StaffAuthHibernateGate>
  );
}
