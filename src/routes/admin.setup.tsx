import { createFileRoute } from "@tanstack/react-router";
import { SetupWizard } from "@/components/admin/onboarding";
import { StaffAuthHibernateGate } from "@/components/admin/onboarding/staff-auth-hibernate-gate";

export const Route = createFileRoute("/admin/setup")({
  staticData: { adminRouteHeading: "Create owner account" as const },
  component: AdminSetup,
});

function AdminSetup() {
  return (
    <StaffAuthHibernateGate>
      <SetupWizard />
    </StaffAuthHibernateGate>
  );
}
