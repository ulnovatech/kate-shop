import { STAFF_MOBILE_APP_ID } from "./staff-mobile-auth";

/** Deep link host for staff invite resume (mobile onboarding). */
export const STAFF_MOBILE_INVITE_HOST = "accept-invite";

/** Kate Admin APK package id (Capacitor applicationId). */
export const STAFF_MOBILE_ANDROID_PACKAGE = STAFF_MOBILE_APP_ID;

export const STAFF_PENDING_INVITE_STORAGE_KEY = "kate_admin_pending_invite_token";

export function buildStaffInviteDeepLink(token: string): string {
  return `${STAFF_MOBILE_APP_ID}://${STAFF_MOBILE_INVITE_HOST}?token=${encodeURIComponent(token)}`;
}

/**
 * Android Chrome intent URL — opens the APK when installed.
 * @see https://developer.chrome.com/docs/android/intents
 */
export function buildStaffInviteAndroidIntent(token: string, browserFallbackUrl?: string): string {
  const query = `token=${encodeURIComponent(token)}`;
  const intentPath = `${STAFF_MOBILE_INVITE_HOST}?${query}`;
  let intent = `intent://${intentPath}#Intent;scheme=${STAFF_MOBILE_APP_ID};package=${STAFF_MOBILE_ANDROID_PACKAGE};end`;
  if (browserFallbackUrl?.trim()) {
    intent = intent.replace(
      ";end",
      `;S.browser_fallback_url=${encodeURIComponent(browserFallbackUrl.trim())};end`,
    );
  }
  return intent;
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
