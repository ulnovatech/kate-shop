import { STAFF_MOBILE_APP_ID } from "./staff-mobile-auth";

/** Deep link host for order detail (C12). */
export const STAFF_MOBILE_ORDERS_HOST = "orders";

export function buildStaffOrderDeepLink(orderId: string): string {
  return `${STAFF_MOBILE_APP_ID}://${STAFF_MOBILE_ORDERS_HOST}/${encodeURIComponent(orderId)}`;
}

/** Admin web path opened from a notification tap. */
export function staffOrderPath(orderId: string): string {
  return `/orders/${encodeURIComponent(orderId)}`;
}

export function isStaffOrderDeepLink(urlString: string): boolean {
  if (!urlString.startsWith(`${STAFF_MOBILE_APP_ID}://`)) return false;
  try {
    const normalized = urlString.replace(`${STAFF_MOBILE_APP_ID}://`, "https://callback.local/");
    const url = new URL(normalized);
    return url.hostname === STAFF_MOBILE_ORDERS_HOST || url.pathname.startsWith("/orders");
  } catch {
    return urlString.includes(`${STAFF_MOBILE_ORDERS_HOST}/`);
  }
}

export function parseStaffOrderIdFromUrl(urlString: string): string | null {
  if (!isStaffOrderDeepLink(urlString)) return null;
  try {
    const direct = new URL(urlString);
    if (direct.hostname === STAFF_MOBILE_ORDERS_HOST) {
      const id = direct.pathname.replace(/^\/+/, "").split("/")[0];
      return id ? decodeURIComponent(id) : null;
    }
  } catch {
    // fall through to normalized parse
  }

  try {
    const normalized = urlString.replace(`${STAFF_MOBILE_APP_ID}://`, "https://callback.local/");
    const url = new URL(normalized);
    if (url.hostname === STAFF_MOBILE_ORDERS_HOST) {
      const id = url.pathname.replace(/^\/+/, "").split("/")[0];
      return id ? decodeURIComponent(id) : null;
    }
    const segments = url.pathname.replace(/^\/+/, "").split("/");
    if (segments[0] === STAFF_MOBILE_ORDERS_HOST && segments[1]) {
      return decodeURIComponent(segments[1]);
    }
  } catch {
    const match = urlString.match(/orders\/([^?#]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }

  return null;
}
