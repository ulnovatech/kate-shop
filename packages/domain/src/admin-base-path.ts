/** `/admin` on the monolith storefront; `/` on `apps/admin` (C3). */
function normalizeAdminBase(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.replace(/\/$/, "") || "/";
}

export const ADMIN_BASE_PATH = normalizeAdminBase(import.meta.env.VITE_ADMIN_BASE_PATH ?? "/admin");

/** Build a staff URL for the current admin client (monolith or standalone). */
export function adminUrl(path = ""): string {
  if (!path || path === "/") {
    return ADMIN_BASE_PATH === "/" ? "/" : ADMIN_BASE_PATH;
  }
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (ADMIN_BASE_PATH === "/") return suffix;
  return `${ADMIN_BASE_PATH}${suffix}`;
}

export const ADMIN_LOGIN_PATH = adminUrl("/login");
export const ADMIN_JOIN_PATH = adminUrl("/join");
export const ADMIN_SIGNUP_PATH = adminUrl("/signup");
export const ADMIN_ACCOUNT_PATH = adminUrl("/account");
export const ADMIN_SETUP_PATH = adminUrl("/setup");
export const ADMIN_ACCEPT_INVITE_PATH = adminUrl("/accept-invite");
export const ADMIN_LOGIN_CALLBACK_PATH = adminUrl("/login-callback");
export const ADMIN_INSTALL_PATH = adminUrl("/install");
export const ADMIN_DASHBOARD_PATH = adminUrl("/");

/** TanStack Router target for product edit (monolith + standalone). */
export function adminProductEditTarget(id: string) {
  return { to: adminUrl("/products/$id"), params: { id } } as const;
}

/** TanStack Router target for products list, optionally filtered by category. */
export function adminProductsListTarget(categoryId?: string) {
  return {
    to: adminUrl("/products/"),
    search: categoryId ? { category: categoryId } : undefined,
  } as const;
}

/** TanStack Router target for order detail. */
export function adminOrderDetailTarget(id: string) {
  return { to: adminUrl("/orders/$id"), params: { id } } as const;
}

/** Storefront origin for “View shop” from the standalone admin app. */
export const SHOP_ORIGIN = (import.meta.env.VITE_APP_ORIGIN ?? "http://localhost:5173").replace(
  /\/$/,
  "",
);
