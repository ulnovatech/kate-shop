import { createFileRoute } from "@tanstack/react-router";
import { AdminLoginPage } from "@/components/admin/onboarding";
import { StaffAuthHibernateGate } from "@/components/admin/onboarding/staff-auth-hibernate-gate";

export const Route = createFileRoute("/admin/login")({
  staticData: { adminRouteHeading: "Sign in" as const },
  component: AdminLogin,
});

function AdminLogin() {
  return (
    <StaffAuthHibernateGate>
      <AdminLoginPage />
    </StaffAuthHibernateGate>
  );
}
