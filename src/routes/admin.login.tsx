import { createFileRoute } from "@tanstack/react-router";
import { AdminLoginPage } from "@/components/admin/onboarding";

export const Route = createFileRoute("/admin/login")({
  staticData: { adminRouteHeading: "Sign in" as const },
  component: AdminLogin,
});

function AdminLogin() {
  return <AdminLoginPage />;
}
