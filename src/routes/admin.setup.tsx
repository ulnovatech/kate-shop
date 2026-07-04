import { createFileRoute } from "@tanstack/react-router";
import { SetupWizard } from "@/components/admin/onboarding";

export const Route = createFileRoute("/admin/setup")({
  staticData: { adminRouteHeading: "Create owner account" as const },
  component: AdminSetup,
});

function AdminSetup() {
  return <SetupWizard />;
}
