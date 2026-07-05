import { AdminMobileSettingsPanel } from "@/components/admin/settings/admin-mobile-settings-panel";
import { SettingsHubShell } from "./settings-hub-nav";

export function MobileAppSettingsPage() {
  return (
    <SettingsHubShell
      activeNav="mobile-app"
      title="Mobile app"
      description="Publish the Kate Admin Android app, share install links, and push updates to staff devices."
    >
      <div className="mt-stack-lg max-w-3xl">
        <AdminMobileSettingsPanel />
      </div>
    </SettingsHubShell>
  );
}
