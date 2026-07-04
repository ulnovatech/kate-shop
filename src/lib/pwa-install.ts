/** PWA install prompt — capture, dismiss, and eligibility (Phase 7 C4). */

import { isStaffWebHost } from "@/lib/staff-pwa";

export const PWA_INSTALL_DISMISS_KEY = "kate-pwa-install-dismissed";
export const PWA_VISIT_COUNT_KEY = "kate-pwa-visit-count";
export const PWA_VISIT_SESSION_KEY = "kate-pwa-visit-session";
export const PWA_DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/** Storefront paths / hosts where the install banner must not appear. */
export function isPwaInstallBlockedPath(pathname: string, hostname?: string): boolean {
  if (isStaffWebHost(hostname)) return true;
  const path = pathname.toLowerCase();
  return path.startsWith("/admin") || path.startsWith("/checkout");
}

export function getPwaVisitCount(): number {
  if (typeof localStorage === "undefined") return 0;
  const raw = localStorage.getItem(PWA_VISIT_COUNT_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Count one storefront visit per browser session. */
export function recordPwaStorefrontVisit(): number {
  if (typeof window === "undefined") return 0;
  if (!sessionStorage.getItem(PWA_VISIT_SESSION_KEY)) {
    sessionStorage.setItem(PWA_VISIT_SESSION_KEY, "1");
    const next = getPwaVisitCount() + 1;
    try {
      localStorage.setItem(PWA_VISIT_COUNT_KEY, String(next));
    } catch {
      // Ignore quota errors.
    }
    return next;
  }
  return getPwaVisitCount();
}

export function dismissPwaInstallOffer(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PWA_INSTALL_DISMISS_KEY, String(Date.now()));
  } catch {
    // Ignore quota errors.
  }
}

export function isPwaInstallDismissed(): boolean {
  if (typeof localStorage === "undefined") return false;
  const raw = localStorage.getItem(PWA_INSTALL_DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = parseInt(raw, 10);
  if (!Number.isFinite(dismissedAt)) return false;
  return Date.now() - dismissedAt < PWA_DISMISS_MS;
}

export function hasDeferredInstallPrompt(): boolean {
  return deferredInstallPrompt !== null;
}

export function captureInstallPrompt(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    handler();
  };

  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
}

export function clearDeferredInstallPrompt(): void {
  deferredInstallPrompt = null;
}

export async function triggerInstallPrompt(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredInstallPrompt) return "unavailable";
  const prompt = deferredInstallPrompt;
  deferredInstallPrompt = null;
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  return outcome;
}

export function shouldOfferPwaInstall(input: {
  isProd: boolean;
  pathname: string;
  hostname?: string;
  visitCount: number;
  hasCustomerSession: boolean;
  hasDeferredPrompt: boolean;
  isIos: boolean;
  dismissed?: boolean;
  standalone?: boolean;
}): boolean {
  if (!input.isProd) return false;
  if (isPwaInstallBlockedPath(input.pathname, input.hostname)) return false;
  if (input.standalone ?? isStandalonePwa()) return false;
  if (input.dismissed ?? isPwaInstallDismissed()) return false;
  if (input.visitCount < 2 && !input.hasCustomerSession) return false;
  return input.hasDeferredPrompt || input.isIos;
}
