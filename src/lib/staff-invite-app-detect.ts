import { ADMIN_ACCEPT_INVITE_PATH } from "@kate/domain/admin-base-path";
import {
  buildStaffInviteAndroidIntent,
  buildStaffInviteDeepLink,
} from "@kate/domain/staff-invite-links";
import { savePendingStaffInviteToken } from "@/lib/staff-invite-pending";

export type StaffAppInstallProbeResult = "opened" | "not_installed";

export const STAFF_INVITE_SKIP_APP_PROBE_PARAM = "skip_app_probe";

export type ProbeStaffAppOptions = {
  timeoutMs?: number;
  browserFallbackUrl?: string;
  /** Inject for tests — skips navigation. */
  openUrl?: (url: string) => void;
};

const DEFAULT_PROBE_TIMEOUT_MS = 2_000;

/** True on Android Chrome (intent URLs work best here). */
export function isAndroidChromeBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Android/i.test(ua) && /Chrome/i.test(ua) && !/EdgA|OPR|SamsungBrowser/i.test(ua);
}

/**
 * Web URL used when the APK is not installed — avoids Chrome defaulting to Play Store.
 * Includes skip_app_probe so the fallback page shows the install gate without re-probing.
 */
export function resolveStaffInviteIntentFallbackUrl(token: string, origin?: string): string {
  const baseOrigin =
    origin?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "https://admin.local");
  const path = ADMIN_ACCEPT_INVITE_PATH.startsWith("/")
    ? ADMIN_ACCEPT_INVITE_PATH
    : `/${ADMIN_ACCEPT_INVITE_PATH}`;
  const url = new URL(path, baseOrigin);
  url.searchParams.set("token", token);
  url.searchParams.set(STAFF_INVITE_SKIP_APP_PROBE_PARAM, "1");
  return url.href;
}

function resolveBrowserFallbackUrl(token: string, browserFallbackUrl?: string): string | undefined {
  if (browserFallbackUrl?.trim()) return browserFallbackUrl.trim();
  if (!isAndroidChromeBrowser()) return undefined;
  return resolveStaffInviteIntentFallbackUrl(token);
}

function buildInviteOpenUrl(token: string, browserFallbackUrl?: string): string {
  const fallback = resolveBrowserFallbackUrl(token, browserFallbackUrl);
  if (isAndroidChromeBrowser()) {
    return buildStaffInviteAndroidIntent(token, fallback);
  }
  return buildStaffInviteDeepLink(token);
}

/**
 * Attempts to open Kate Admin via deep link / Android intent.
 * Returns `opened` when the page hides (user switched to the app).
 */
export function probeStaffAppForInvite(
  token: string,
  options: ProbeStaffAppOptions = {},
): Promise<StaffAppInstallProbeResult> {
  const { timeoutMs = DEFAULT_PROBE_TIMEOUT_MS, browserFallbackUrl, openUrl } = options;

  savePendingStaffInviteToken(token);

  return new Promise((resolve) => {
    let settled = false;

    const finish = (result: StaffAppInstallProbeResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const onPageHidden = () => finish("opened");

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") onPageHidden();
    };

    const cleanup = () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHidden);
      window.removeEventListener("blur", onPageHidden);
      window.clearTimeout(timer);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHidden);
    window.addEventListener("blur", onPageHidden);

    const url = buildInviteOpenUrl(token, browserFallbackUrl);
    if (openUrl) {
      openUrl(url);
    } else if (typeof window !== "undefined") {
      window.location.href = url;
    }

    const timer = window.setTimeout(() => finish("not_installed"), timeoutMs);
  });
}

/** Open Kate Admin invite deep link (user gesture). */
export function openStaffInviteInApp(token: string): void {
  savePendingStaffInviteToken(token);
  if (typeof window === "undefined") return;
  window.location.href = buildInviteOpenUrl(token);
}
