import type { AdminPermission } from "./rbac";
import {
  ADMIN_ACCEPT_INVITE_PATH,
  ADMIN_BASE_PATH,
  ADMIN_INSTALL_PATH,
  ADMIN_JOIN_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_LOGIN_CALLBACK_PATH,
  ADMIN_SETUP_PATH,
  ADMIN_SIGNUP_PATH,
  adminUrl,
} from "./admin-base-path";

/** Staff routes that render without AdminLayout / route guard (auth flows). */
export const ADMIN_PUBLIC_PATHS = [
  ADMIN_LOGIN_PATH,
  ADMIN_JOIN_PATH,
  ADMIN_SIGNUP_PATH,
  ADMIN_LOGIN_CALLBACK_PATH,
  ADMIN_SETUP_PATH,
  ADMIN_ACCEPT_INVITE_PATH,
  ADMIN_INSTALL_PATH,
  adminUrl("/r"),
] as const;

export type AdminRouteStatic = {
  adminPermission?: AdminPermission;
};

export function isAdminPath(pathname: string): boolean {
  if (ADMIN_BASE_PATH === "/") return true;
  const base = ADMIN_BASE_PATH.toLowerCase();
  const path = pathname.toLowerCase();
  return path === base || path.startsWith(`${base}/`);
}

export function isAdminPublicPath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return ADMIN_PUBLIC_PATHS.some((p) => {
    const pub = p.toLowerCase();
    return path === pub || path.startsWith(`${pub}/`);
  });
}

/** On admin subdomain (C6), every path is staff-only and online-only. */
export function isStaffOriginPath(pathname: string, host?: string): boolean {
  if (host?.toLowerCase().startsWith("admin.")) return true;
  return isAdminPath(pathname);
}

export {
  adminUrl,
  adminProductEditTarget,
  adminProductsListTarget,
  adminOrderDetailTarget,
} from "./admin-base-path";
