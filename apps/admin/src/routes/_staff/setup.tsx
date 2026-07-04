import { createFileRoute } from "@tanstack/react-router";
import { SetupWizard } from "@/components/admin/onboarding";

export const Route = createFileRoute("/_staff/setup")({
  component: AdminSetup,
});

function AdminSetup() {
  return <SetupWizard />;
}
