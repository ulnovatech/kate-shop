import { STAFF_MOBILE_APP_ID } from "./staff-mobile-auth";

/** Deep link host for staff invite resume (mobile onboarding). */
export const STAFF_MOBILE_INVITE_HOST = "accept-invite";

export const STAFF_PENDING_INVITE_STORAGE_KEY = "kate_admin_pending_invite_token";

export function buildStaffInviteDeepLink(token: string): string {
  return `${STAFF_MOBILE_APP_ID}://${STAFF_MOBILE_INVITE_HOST}?token=${encodeURIComponent(token)}`;
}

export function parseStaffInviteTokenFromUrl(urlString: string): string | null {
  if (!urlString.includes(STAFF_MOBILE_INVITE_HOST)) return null;

  try {
    if (urlString.startsWith(`${STAFF_MOBILE_APP_ID}://`)) {
      const normalized = urlString.replace(`${STAFF_MOBILE_APP_ID}://`, "https://callback.local/");
      const url = new URL(normalized);
      if (url.hostname === STAFF_MOBILE_INVITE_HOST) {
        return url.searchParams.get("token")?.trim() || null;
      }
    }

    const httpUrl = new URL(urlString, "https://placeholder.local");
    if (
      httpUrl.pathname.includes("accept-invite") ||
      httpUrl.hostname === STAFF_MOBILE_INVITE_HOST
    ) {
      return httpUrl.searchParams.get("token")?.trim() || null;
    }
  } catch {
    const match = urlString.match(/[?&]token=([^&#]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }

  return null;
}
