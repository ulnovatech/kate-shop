import { createFileRoute } from "@tanstack/react-router";
import { MobileAppSettingsPage } from "@/components/admin/settings";

export const Route = createFileRoute("/admin/mobile-app")({
  staticData: {
    adminPermission: "settings" as const,
    adminRouteHeading: "Mobile app" as const,
  },
  component: AdminMobileApp,
});

function AdminMobileApp() {
  return <MobileAppSettingsPage />;
}
