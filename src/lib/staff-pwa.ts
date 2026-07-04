import { ADMIN_BASE_PATH } from "@kate/domain/admin-base-path";

/** Shop PWA icon (storefront install). */
export const SHOP_PWA_ICON = "/pwa-icon.svg";

/** Kate Admin PWA icon — distinct from shop (C9). */
export const ADMIN_PWA_ICON = "/admin-icon.svg";

export const STAFF_PWA_NAME = "Kate Admin";
export const STAFF_PWA_SHORT_NAME = "Kate Admin";
export const STAFF_PWA_DESCRIPTION =
  "Kate shop staff console — orders, catalog, and store operations.";

/** PWA manifest `id` — separates staff install from shop on shared origins. */
export function staffPwaManifestId(): string {
  return ADMIN_BASE_PATH === "/" ? "/" : ADMIN_BASE_PATH;
}

/**
 * Dedicated admin subdomain, e.g. `admin.example.com`.
 * Does not match monolith `/admin` on the shop host.
 */
export function isStaffWebHost(hostname?: string): boolean {
  const host = (
    hostname ?? (typeof window !== "undefined" ? window.location.hostname : "")
  ).toLowerCase();
  if (!host) return false;
  return host === "admin" || host.startsWith("admin.");
}

/**
 * Standalone `apps/admin` or `admin.*` subdomain — shop Workbox must not run here (C9).
 */
export function shouldEvictShopServiceWorker(hostname?: string): boolean {
  if (typeof window === "undefined") return false;
  if (isStaffWebHost(hostname)) return true;
  return ADMIN_BASE_PATH === "/";
}

/** User-facing offline copy for staff surfaces. */
export function staffOfflineBannerMessage(): string {
  return "You are offline. Kate Admin needs an internet connection for orders, inventory, and staff actions.";
}

/** Dev helper when the admin Vite server is not running. */
export function staffDevServerUnreachableMessage(): string {
  return "The admin dev server is not running. In your project folder run npm run dev:admin, then refresh this page.";
}

/**
 * Unregister shop service workers and clear Workbox caches on the staff origin.
 * Safe to call repeatedly; no-op when `shouldEvictShopServiceWorker()` is false.
 */
export async function evictShopPwaFromStaffOrigin(hostname?: string): Promise<void> {
  if (!shouldEvictShopServiceWorker(hostname)) return;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}
