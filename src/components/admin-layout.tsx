import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu, Store, UserCircle } from "lucide-react";
import { AdminBrandMark, useAdminShopName } from "@/components/admin-brand-mark";
import { AdminNavCompletionRing } from "@/components/admin/admin-nav-completion-ring";
import { AdminSetupProgress } from "@/components/admin/admin-setup-progress";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";
import { AdminKeyboardShortcutsDialog } from "@/components/admin/admin-keyboard-shortcuts-dialog";
import { ADMIN_NAV_SECTIONS } from "@/lib/admin-nav-sections";
import { ADMIN_BASE_PATH, SHOP_ORIGIN } from "@/lib/admin-base-path";
import { SkipLink } from "@/components/skip-link";
import { RouteAnnouncer } from "@/components/a11y/route-announcer";
import { AdminShellSkeleton, AdminRefreshingBar } from "@/components/loading-states";
import { useAuth } from "@/lib/auth";
import { adminIconButton } from "@/lib/admin-mobile";
import { ADMIN_PUBLIC_PATHS, adminUrl } from "@/lib/admin-routes";
import { resolveStaffUnauthenticatedRedirect } from "@/lib/staff-auth-entry";
import { defaultAdminPath, displayRoleLabel, hasPermission } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { AdminMobileNavDrawer } from "@/components/admin-mobile-nav-drawer";
import { AdminNavBadge } from "@/components/admin-nav-badge";
import { AdminPullToRefresh } from "@/components/admin-pull-to-refresh";
import {
  AdminMobileQuickNav,
  adminMobileQuickNavVisible,
} from "@/components/admin-mobile-quick-nav";
import { useAdminNavBadges } from "@/hooks/use-admin-nav-badges";
import { useAdminRealtimeRefresh } from "@/hooks/use-admin-realtime-refresh";
import { useAdminNewOrderHaptic } from "@/hooks/use-admin-new-order-haptic";
import { useAdminSetupCompletion } from "@/hooks/use-admin-setup-completion";
import { useAdminFocusMode } from "@/hooks/use-admin-focus-mode";
import { useAdminKeyboardShortcuts } from "@/hooks/use-admin-keyboard-shortcuts";
import { NAV_PATH_SETUP_CHECK } from "@/lib/admin-setup-completion";
import { refreshAdminRouteQueries } from "@/lib/admin-refresh";
import { clearStaffAppUnlock, staffScreenLockEnabled } from "@/lib/staff-screen-lock";
import { StaffScreenLockProvider } from "@/components/staff-screen-lock";
import { AdminMobileNavOverrideProvider } from "@/components/admin/admin-mobile-nav-override";
import { cn } from "@/lib/utils";

function AdminShopNameMobile({ roleBadge }: { roleBadge: string }) {
  const shopName = useAdminShopName();
  return (
    <>
      {shopName} · {roleBadge}
    </>
  );
}

function navLinkClass(active: boolean) {
  return `flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-sidebar-accent text-gold" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"}`;
}

const ORDERS_NAV_PATH = adminUrl("/orders");

function navIconWithBadge(
  Icon: React.ComponentType<{ className?: string }>,
  badge: number,
  iconClassName: string,
  badgeClassName?: string,
  setupComplete?: boolean | null,
  setupLabel?: string,
) {
  return (
    <span className="relative inline-flex">
      {setupComplete != null && setupLabel ? (
        <AdminNavCompletionRing complete={setupComplete} label={setupLabel} />
      ) : null}
      <Icon className={iconClassName} />
      <AdminNavBadge count={badge} className={badgeClassName} />
    </span>
  );
}

export function AdminLayout({ children }: { children?: ReactNode }) {
  const { user, permissions, initialLoading, refreshing, signOut } = useAuth();
  const { unopenedOrders } = useAdminNavBadges();
  useAdminRealtimeRefresh();
  useAdminNewOrderHaptic();
  const { focusMode, toggleFocusMode } = useAdminFocusMode();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const showSetupCompletion = permissions.canManageSettings || permissions.canManageCatalog;
  const { data: setupCompletion } = useAdminSetupCompletion(showSetupCompletion);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [navOpen, setNavOpen] = useState(false);
  const shortcutsEnabled = !ADMIN_PUBLIC_PATHS.some((p) => path.startsWith(p));

  useAdminKeyboardShortcuts({
    enabled: shortcutsEnabled && Boolean(user),
    permissions,
    onOpenPalette: () => setPaletteOpen(true),
    onOpenShortcuts: () => setShortcutsOpen(true),
    onToggleFocusMode: toggleFocusMode,
  });

  const handlePullRefresh = useCallback(
    () => refreshAdminRouteQueries(queryClient, path),
    [queryClient, path],
  );

  const visibleNavSections = useMemo(
    () =>
      ADMIN_NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => hasPermission(permissions, item.permission)),
      })).filter((section) => section.items.length > 0),
    [permissions],
  );

  useEffect(() => {
    if (ADMIN_PUBLIC_PATHS.some((p) => path.startsWith(p))) return;
    if (!initialLoading && (!user || !permissions.canAccessAdmin)) {
      navigate(resolveStaffUnauthenticatedRedirect());
    }
  }, [user, permissions.canAccessAdmin, initialLoading, navigate, path]);

  useEffect(() => {
    setNavOpen(false);
  }, [path]);

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  const handleSignOut = useCallback(async () => {
    clearStaffAppUnlock();
    await signOut();
    navigate(resolveStaffUnauthenticatedRedirect());
  }, [navigate, signOut]);

  if (initialLoading) {
    return <AdminShellSkeleton />;
  }

  if (!user || !permissions.canAccessAdmin) {
    return <AdminShellSkeleton />;
  }

  const roleBadge = displayRoleLabel(permissions);

  const viewShopLink = (
    <a
      href={ADMIN_BASE_PATH === "/" ? SHOP_ORIGIN : "/"}
      className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
    >
      <Store className="h-4 w-4" /> View shop
    </a>
  );

  const renderNavLinks = (onNavigate?: () => void) => (
    <div className="space-y-4">
      {visibleNavSections.map((section) => (
        <div key={section.label}>
          {section.label === "Setup" && setupCompletion && !setupCompletion.isComplete ? (
            <AdminSetupProgress percent={setupCompletion.percentComplete} />
          ) : null}
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/45">
            {section.label}
          </p>
          <div className="space-y-1">
            {section.items.map((n) => {
              const active = n.exact ? path === n.to : path.startsWith(n.to);
              const badge = n.to === ORDERS_NAV_PATH ? unopenedOrders : 0;
              const ordersLabel = badge > 0 ? `${n.label}, ${badge} unopened` : n.label;
              const checkId = NAV_PATH_SETUP_CHECK[n.to];
              const setupStatus = checkId ? setupCompletion?.checksById[checkId] : undefined;
              const setupComplete = setupStatus ? setupStatus.complete : null;
              const setupLabel = setupStatus?.label ?? n.label;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={onNavigate}
                  className={navLinkClass(active)}
                  aria-label={n.to === ORDERS_NAV_PATH ? ordersLabel : undefined}
                >
                  {navIconWithBadge(
                    n.icon,
                    badge,
                    "h-4 w-4",
                    undefined,
                    checkId ? setupComplete : null,
                    checkId ? setupLabel : undefined,
                  )}{" "}
                  {n.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <StaffScreenLockProvider enabled={staffScreenLockEnabled()}>
      <AdminMobileNavOverrideProvider>
        <div className={cn("flex min-h-dvh bg-background", focusMode && "admin-focus-mode")}>
          <SkipLink />
          <RouteAnnouncer />
          <aside
            className={cn(
              "hidden w-60 shrink-0 border-r bg-sidebar text-sidebar-foreground md:flex md:flex-col",
              focusMode && "md:hidden",
            )}
          >
            <div className="border-b border-sidebar-border px-5 py-5">
              <AdminBrandMark subtitle={`Admin · ${roleBadge}`} />
            </div>
            <nav className="flex-1 space-y-1 p-3">{renderNavLinks()}</nav>
            <div className="space-y-2 border-t border-sidebar-border p-3">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
              >
                <span className="text-xs text-sidebar-foreground/50">⌘K</span>
                <span className="flex-1 text-left">Command palette</span>
              </button>
              <Link
                to={adminUrl("/account")}
                className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
              >
                <UserCircle className="h-4 w-4" /> My account
              </Link>
              {viewShopLink}
              <button
                onClick={() => void handleSignOut()}
                className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </aside>

          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
            <header className="flex shrink-0 items-center gap-2 border-b bg-sidebar px-3 py-2.5 text-sidebar-foreground md:hidden">
              <Button
                type="button"
                variant="outline"
                className={`${adminIconButton} border-sidebar-border bg-sidebar-accent/30 ${navOpen ? "text-gold" : "text-sidebar-foreground"}`}
                aria-label={navOpen ? "Close menu" : "Open menu"}
                aria-expanded={navOpen}
                aria-controls="admin-mobile-nav"
                onClick={() => setNavOpen((open) => !open)}
              >
                <Menu aria-hidden />
              </Button>
              <Link
                to={defaultAdminPath(permissions.role)}
                className="min-w-0 flex-1 truncate font-heading text-sm font-semibold text-gold"
              >
                <AdminShopNameMobile roleBadge={roleBadge} />
              </Link>
              <Button
                size="icon"
                variant="outline"
                className={`${adminIconButton} border-sidebar-border bg-sidebar-accent/30 text-sidebar-foreground`}
                aria-label="Sign out"
                onClick={() => void handleSignOut()}
              >
                <LogOut aria-hidden />
              </Button>
            </header>

            <main
              id="main-content"
              tabIndex={-1}
              className="admin-overscroll admin-scroll-root relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-3 pb-[calc(3rem+env(safe-area-inset-bottom,0px))] sm:p-6 md:p-8 md:pb-8"
            >
              {focusMode ? (
                <div className="mb-4 flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={toggleFocusMode}>
                    Exit focus mode
                  </Button>
                </div>
              ) : null}
              <AdminPullToRefresh onRefresh={handlePullRefresh} disabled={navOpen}>
                <AdminRefreshingBar active={refreshing} />
                {children ?? <Outlet />}
              </AdminPullToRefresh>
            </main>

            {adminMobileQuickNavVisible(permissions) && !focusMode && (
              <AdminMobileQuickNav
                permissions={permissions}
                unopenedOrders={unopenedOrders}
                navOpen={navOpen}
                onMenuToggle={() => setNavOpen((open) => !open)}
              />
            )}
          </div>

          <AdminMobileNavDrawer
            open={navOpen}
            onClose={() => setNavOpen(false)}
            title={<AdminBrandMark subtitle={`Admin · ${roleBadge}`} />}
            footer={
              <>
                <Link
                  to={adminUrl("/account")}
                  onClick={() => setNavOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                >
                  <UserCircle className="h-4 w-4" /> My account
                </Link>
                <a
                  href={ADMIN_BASE_PATH === "/" ? SHOP_ORIGIN : "/"}
                  onClick={() => setNavOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                >
                  <Store className="h-4 w-4" /> View shop
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setNavOpen(false);
                    void handleSignOut();
                  }}
                  className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            }
          >
            {renderNavLinks(() => setNavOpen(false))}
          </AdminMobileNavDrawer>

          <AdminCommandPalette
            open={paletteOpen}
            onOpenChange={setPaletteOpen}
            permissions={permissions}
            focusMode={focusMode}
            onToggleFocusMode={toggleFocusMode}
            onOpenShortcuts={() => setShortcutsOpen(true)}
          />
          <AdminKeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
        </div>
      </AdminMobileNavOverrideProvider>
    </StaffScreenLockProvider>
  );
}
