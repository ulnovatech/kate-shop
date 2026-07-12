import { createFileRoute } from "@tanstack/react-router";
import { StaffSignupPage } from "@/components/admin/onboarding";
import { StaffAuthHibernateGate } from "@/components/admin/onboarding/staff-auth-hibernate-gate";

export const Route = createFileRoute("/_staff/signup")({
  staticData: { adminRouteHeading: "Sign up" as const },
  component: AdminSignup,
});

function AdminSignup() {
  return (
    <StaffAuthHibernateGate>
      <StaffSignupPage />
    </StaffAuthHibernateGate>
  );
}
