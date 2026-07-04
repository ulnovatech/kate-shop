import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useAdminSetupCompletion } from "@/hooks/use-admin-setup-completion";
import { adminUrl } from "@/lib/admin-routes";
import { cn } from "@/lib/utils";
import {
  SETTINGS_HUB_NAV_ITEMS,
  SETTINGS_TAB_OPTIONS,
  type SettingsHubNavId,
  type SettingsTabId,
} from "./settings-hub-schema";

type SettingsHubNavProps = {
  active: SettingsHubNavId;
};

export function SettingsHubNav({ active }: SettingsHubNavProps) {
  const { data: setup } = useAdminSetupCompletion();

  return (
    <nav
      aria-label="Settings sections"
      className="flex flex-nowrap gap-1 overflow-x-auto border-b pb-px"
    >
      {SETTINGS_HUB_NAV_ITEMS.map((item) => {
        const isActive = item.id === active;
        const complete =
          item.setupCheckId && setup ? setup.checksById[item.setupCheckId]?.complete : undefined;

        return (
          <Link
            key={item.id}
            to={adminUrl(item.path)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 type-body-sm font-medium transition-common",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
            {complete === true ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden />
            ) : complete === false ? (
              <span
                className="h-2 w-2 rounded-full bg-gold"
                aria-label="Needs setup"
                title="Needs setup"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

type SettingsTabNavProps = {
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
};

export function SettingsTabNav({ activeTab, onTabChange }: SettingsTabNavProps) {
  return (
    <nav
      aria-label="Settings tabs"
      className="flex flex-nowrap gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-0.5"
    >
      {SETTINGS_TAB_OPTIONS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "shrink-0 rounded-md px-3 py-2 type-body-sm transition-common",
            activeTab === tab.id
              ? "bg-background font-medium text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-current={activeTab === tab.id ? "page" : undefined}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

type SettingsHubShellProps = {
  activeNav: SettingsHubNavId;
  title: string;
  description?: string;
  children: ReactNode;
  headerExtra?: ReactNode;
  saveBar?: ReactNode;
};

export function SettingsHubShell({
  activeNav,
  title,
  description,
  children,
  headerExtra,
  saveBar,
}: SettingsHubShellProps) {
  return (
    <div className="space-y-section">
      <header className="space-y-stack">
        <div className="flex flex-wrap items-start justify-between gap-inline">
          <div>
            <h1 className="type-h1">{title}</h1>
            {description ? (
              <p className="mt-1 type-body-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {headerExtra}
        </div>
        <SettingsHubNav active={activeNav} />
      </header>

      <div className="min-w-0">{children}</div>

      {saveBar}
    </div>
  );
}
