import { createFileRoute } from "@tanstack/react-router";
import {
  SettingsHubPage,
  adminSettingsSearchSchema,
  resolveSettingsTab,
} from "@/components/admin/settings";

export const Route = createFileRoute("/_staff/settings")({
  staticData: { adminPermission: "settings" as const, adminRouteHeading: "Store setup" as const },
  validateSearch: (search) => adminSettingsSearchSchema.parse(search),
  component: AdminSettings,
});

function AdminSettings() {
  const { tab } = Route.useSearch();
  return <SettingsHubPage activeTab={resolveSettingsTab(tab)} />;
}
