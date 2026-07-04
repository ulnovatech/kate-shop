import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Menu, Package, ShoppingBag, type LucideIcon } from "lucide-react";
import { useAdminMobileNavOverride } from "@/components/admin/admin-mobile-nav-override";
import {
  AdminCreateActionSheet,
  adminCreateActionsVisible,
  isAdminCreatePath,
  CREATE_ACTIONS,
} from "@/components/admin/admin-create-action-sheet";
import { AdminCreateTab } from "@/components/admin/admin-create-tab";
import { AdminNavBadge } from "@/components/admin-nav-badge";
import { adminUrl } from "@/lib/admin-routes";
import type { AdminPermissions } from "@/lib/rbac";
import { cn } from "@/lib/utils";

const ORDERS_NAV_PATH = adminUrl("/orders");
const PRODUCTS_NAV_PATH = adminUrl("/products");

type TabDef = {
  id: "today" | "orders" | "products";
  to: string;
  label: string;
  icon: LucideIcon;
  show: (permissions: AdminPermissions) => boolean;
};

const MOBILE_TABS: TabDef[] = [
  {
    id: "today",
    to: adminUrl("/"),
    label: "Today",
    icon: LayoutDashboard,
    show: (p) => p.canAccessAdmin,
  },
  {
    id: "orders",
    to: ORDERS_NAV_PATH,
    label: "Orders",
    icon: ShoppingBag,
    show: (p) => p.canManageOrders,
  },
  {
    id: "products",
    to: PRODUCTS_NAV_PATH,
    label: "Products",
    icon: Package,
    show: (p) => p.canManageCatalog,
  },
];

type AdminMobileQuickNavProps = {
  permissions: AdminPermissions;
  unopenedOrders: number;
  navOpen: boolean;
  onMenuToggle: () => void;
};

function tabClass(active: boolean) {
  return cn(
    "flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors",
    active ? "text-gold" : "text-sidebar-foreground/70",
  );
}

function isTabActive(path: string, to: string): boolean {
  if (to === adminUrl("/")) return path === to;
  return path === to || path.startsWith(`${to}/`);
}

function NavTab({
  to,
  label,
  icon: Icon,
  active,
  badge = 0,
  ariaLabel,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  badge?: number;
  ariaLabel?: string;
}) {
  return (
    <Link
      to={to}
      className={tabClass(active)}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
    >
      <span className="relative">
        <Icon className="h-6 w-6" aria-hidden />
        <AdminNavBadge count={badge} />
      </span>
      {label}
    </Link>
  );
}

export function AdminMobileQuickNav({
  permissions,
  unopenedOrders,
  navOpen,
  onMenuToggle,
}: AdminMobileQuickNavProps) {
  const navOverride = useAdminMobileNavOverride()?.override;
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [createOpen, setCreateOpen] = useState(false);
  const visibleTabs = MOBILE_TABS.filter((tab) => tab.show(permissions));
  const showCreateTab = adminCreateActionsVisible(permissions);
  const createActionCount = CREATE_ACTIONS.filter((a) => a.show(permissions)).length;

  if (visibleTabs.length === 0 && !showCreateTab) {
    return null;
  }

  const beforeCreate = visibleTabs.filter((tab) => tab.id === "today" || tab.id === "orders");
  const afterCreate = visibleTabs.filter((tab) => tab.id === "products");
  const createActive = isAdminCreatePath(path);

  if (navOverride) {
    return <>{navOverride}</>;
  }

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] text-sidebar-foreground md:hidden"
        aria-label="Quick navigation"
      >
        {beforeCreate.map((tab) => {
          const active = isTabActive(path, tab.to);
          const badge = tab.to === ORDERS_NAV_PATH ? unopenedOrders : 0;
          const ordersLabel = badge > 0 ? `${tab.label}, ${badge} unopened` : tab.label;
          return (
            <NavTab
              key={tab.id}
              to={tab.to}
              label={tab.label}
              icon={tab.icon}
              active={active}
              badge={badge}
              ariaLabel={tab.to === ORDERS_NAV_PATH ? ordersLabel : undefined}
            />
          );
        })}

        {showCreateTab && (
          <div
            className={cn(
              "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium",
              createActive ? "text-gold" : "text-sidebar-foreground/70",
            )}
          >
            <AdminCreateTab
              active={createActive}
              onClick={() => setCreateOpen(true)}
              actionCount={createActionCount}
            />
            Add
          </div>
        )}

        {afterCreate.map((tab) => (
          <NavTab
            key={tab.id}
            to={tab.to}
            label={tab.label}
            icon={tab.icon}
            active={isTabActive(path, tab.to)}
          />
        ))}

        <button
          type="button"
          onClick={onMenuToggle}
          aria-expanded={navOpen}
          aria-controls="admin-mobile-nav"
          aria-label={navOpen ? "Close menu" : "Open menu"}
          className={cn(tabClass(navOpen), "touch-manipulation")}
        >
          <Menu className="h-6 w-6" aria-hidden />
          Menu
        </button>
      </nav>

      <AdminCreateActionSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        permissions={permissions}
      />
    </>
  );
}

export function adminMobileQuickNavVisible(permissions: AdminPermissions): boolean {
  return MOBILE_TABS.some((tab) => tab.show(permissions)) || adminCreateActionsVisible(permissions);
}
