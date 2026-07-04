/** Addendum A8 — PWA helpers (offline paths, push extension point). */

import { adminUrl } from "@/lib/admin-base-path";
import {
  ADMIN_PWA_ICON,
  STAFF_PWA_DESCRIPTION,
  STAFF_PWA_NAME,
  STAFF_PWA_SHORT_NAME,
  staffPwaManifestId,
} from "@/lib/staff-pwa";

export const PWA_THEME_COLOR = "#064e3b";
export const PWA_BACKGROUND_COLOR = "#064e3b";

/** Routes that must not be served from cache when offline. */
export const OFFLINE_BLOCKED_PREFIXES = ["/admin", "/checkout", "/order"] as const;

export function isOfflineBlockedPath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return OFFLINE_BLOCKED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Phase 2 hook — register web push after VAPID keys + backend sender exist.
 * @see docs/PWA.md
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported in this browser");
  }
  await navigator.serviceWorker.ready;
  throw new Error(
    "Push notifications are not configured yet. Wire VAPID keys and call subscribeToPushNotifications from your notification service.",
  );
}

export type WebManifestIcon = {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
};

export type WebManifest = {
  id?: string;
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  scope: string;
  display: "standalone";
  background_color: string;
  theme_color: string;
  icons: WebManifestIcon[];
  categories?: string[];
};

export function buildWebManifest(input: {
  shopName: string;
  description: string;
  origin?: string;
}): WebManifest {
  const name = input.shopName.trim() || "Store";
  const shortName = name.length > 12 ? `${name.slice(0, 11)}…` : name;

  return {
    name,
    short_name: shortName,
    description: input.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    icons: [
      {
        src: "/pwa-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/pwa-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}

/** Staff PWA manifest for admin subdomain and `apps/admin` (C9). */
export function buildAdminWebManifest(): WebManifest {
  const scope = adminUrl("/");
  const icons: WebManifestIcon[] = [
    {
      src: ADMIN_PWA_ICON,
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "any",
    },
    {
      src: ADMIN_PWA_ICON,
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "maskable",
    },
  ];

  return {
    id: staffPwaManifestId(),
    name: STAFF_PWA_NAME,
    short_name: STAFF_PWA_SHORT_NAME,
    description: STAFF_PWA_DESCRIPTION,
    start_url: scope,
    scope,
    display: "standalone",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    categories: ["business", "productivity"],
    icons,
  };
}
