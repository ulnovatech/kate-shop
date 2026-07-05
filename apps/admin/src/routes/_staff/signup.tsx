import { createFileRoute } from "@tanstack/react-router";
import { StaffSignupPage } from "@/components/admin/onboarding";

export const Route = createFileRoute("/_staff/signup")({
  staticData: { adminRouteHeading: "Sign up" as const },
  component: AdminSignup,
});

function AdminSignup() {
  return <StaffSignupPage />;
}
