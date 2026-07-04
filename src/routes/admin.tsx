import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { AdminRouteGuard } from "@/components/admin-route-guard";
import {
  isAdminPublicPath,
  type AdminRouteStatic,
} from "@/lib/admin-routes";
import { PWA_THEME_COLOR } from "@/lib/pwa";
import { ADMIN_PWA_ICON } from "@/lib/staff-pwa";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { name: "theme-color", content: PWA_THEME_COLOR },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "manifest", href: "/admin-manifest.webmanifest" },
      { rel: "apple-touch-icon", href: ADMIN_PWA_ICON },
    ],
  }),
  component: AdminSectionLayout,
});

function useAdminRoutePermission() {
  return useRouterState({
    select: (s) => {
      for (let i = s.matches.length - 1; i >= 0; i--) {
        const permission = (s.matches[i].staticData as AdminRouteStatic | undefined)
          ?.adminPermission;
        if (permission) return permission;
      }
      return undefined;
    },
  });
}

function AdminSectionLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const permission = useAdminRoutePermission();

  if (isAdminPublicPath(pathname)) {
    return <Outlet />;
  }

  if (!permission) {
    return (
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminRouteGuard permission={permission}>
        <Outlet />
      </AdminRouteGuard>
    </AdminLayout>
  );
}
