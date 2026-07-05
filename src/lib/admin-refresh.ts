import type { QueryClient } from "@tanstack/react-query";
import { ADMIN_BASE_PATH } from "@/lib/admin-base-path";

/** Staff route path relative to the admin app root (e.g. `/orders`). */
export function normalizeStaffRelativePath(pathname: string): string {
  let path = pathname || "/";
  if (ADMIN_BASE_PATH !== "/") {
    const base = ADMIN_BASE_PATH.toLowerCase();
    const lower = path.toLowerCase();
    if (lower === base) path = "/";
    else if (lower.startsWith(`${base}/`)) path = path.slice(ADMIN_BASE_PATH.length);
  }
  if (!path.startsWith("/")) path = `/${path}`;
  return path.replace(/\/+$/, "") || "/";
}

type RefreshRule = {
  match: (path: string) => boolean;
  keys: string[];
};

const ROUTE_REFRESH_RULES: RefreshRule[] = [
  {
    match: (p) => p === "/",
    keys: ["admin-stats", "admin-nav-badges", "admin-setup-completion"],
  },
  {
    match: (p) => p === "/orders" || p.startsWith("/orders/"),
    keys: ["admin-orders", "admin-order", "admin-nav-badges", "admin-stats"],
  },
  {
    match: (p) => p === "/payments",
    keys: ["admin-unpaid-orders", "admin-orders", "admin-stats"],
  },
  {
    match: (p) => p.startsWith("/products"),
    keys: ["admin-products", "admin-categories", "admin-setup-completion"],
  },
  {
    match: (p) => p === "/inventory",
    keys: ["admin-inventory", "admin-categories", "admin-products"],
  },
  {
    match: (p) => p === "/categories",
    keys: ["admin-categories", "categories"],
  },
  {
    match: (p) => p === "/notifications",
    keys: ["admin-notifications", "admin-stats"],
  },
  {
    match: (p) => p === "/delivery",
    keys: ["admin-delivery", "delivery-config", "admin-setup-completion"],
  },
  {
    match: (p) => p === "/account",
    keys: ["staff-pin-status"],
  },
  {
    match: (p) => p === "/settings",
    keys: [
      "admin-settings",
      "settings",
      "admin-shop-name",
      "staff-pin-status",
      "admin-setup-completion",
    ],
  },
  {
    match: (p) => p === "/team",
    keys: ["admin-invites", "invitable-roles"],
  },
  {
    match: (p) => p === "/roles",
    keys: ["admin-roles", "permission-matrix-meta"],
  },
  {
    match: (p) => p === "/audit",
    keys: ["admin-audit"],
  },
  {
    match: (p) => p === "/recycle",
    keys: ["admin-recycle", "admin-products", "admin-categories"],
  },
  {
    match: (p) => p === "/payment-methods",
    keys: ["checkout-payment-methods", "admin-setup-completion"],
  },
];

export function queryKeysForAdminRefresh(pathname: string): string[] {
  const path = normalizeStaffRelativePath(pathname);
  const keys = new Set<string>();
  for (const rule of ROUTE_REFRESH_RULES) {
    if (rule.match(path)) {
      for (const key of rule.keys) keys.add(key);
    }
  }
  return [...keys];
}

export async function refreshAdminRouteQueries(
  queryClient: QueryClient,
  pathname: string,
): Promise<void> {
  const keys = queryKeysForAdminRefresh(pathname);
  if (keys.length === 0) {
    await queryClient.invalidateQueries();
    return;
  }
  await Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
}
