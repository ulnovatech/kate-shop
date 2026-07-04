import { beforeEach, describe, expect, it } from "vitest";
import {
  dismissPwaInstallOffer,
  getPwaVisitCount,
  isPwaInstallBlockedPath,
  isPwaInstallDismissed,
  PWA_DISMISS_MS,
  PWA_INSTALL_DISMISS_KEY,
  PWA_VISIT_COUNT_KEY,
  PWA_VISIT_SESSION_KEY,
  recordPwaStorefrontVisit,
  shouldOfferPwaInstall,
} from "@/lib/pwa-install";

describe("pwa-install", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("blocks install prompt on admin and checkout", () => {
    expect(isPwaInstallBlockedPath("/checkout")).toBe(true);
    expect(isPwaInstallBlockedPath("/admin/orders")).toBe(true);
    expect(isPwaInstallBlockedPath("/shop")).toBe(false);
    expect(isPwaInstallBlockedPath("/order/KS-1")).toBe(false);
  });

  it("blocks install on admin subdomain regardless of path", () => {
    expect(isPwaInstallBlockedPath("/shop", "admin.example.com")).toBe(true);
    expect(isPwaInstallBlockedPath("/", "admin.example.com")).toBe(true);
  });

  it("counts one visit per browser session", () => {
    expect(recordPwaStorefrontVisit()).toBe(1);
    expect(recordPwaStorefrontVisit()).toBe(1);
    sessionStorage.removeItem(PWA_VISIT_SESSION_KEY);
    expect(recordPwaStorefrontVisit()).toBe(2);
    expect(getPwaVisitCount()).toBe(2);
  });

  it("persists dismiss for 14 days", () => {
    dismissPwaInstallOffer();
    expect(isPwaInstallDismissed()).toBe(true);

    localStorage.setItem(PWA_INSTALL_DISMISS_KEY, String(Date.now() - PWA_DISMISS_MS - 1));
    expect(isPwaInstallDismissed()).toBe(false);
  });

  it("requires prod, engagement, and a viable install path", () => {
    const base = {
      isProd: true,
      pathname: "/shop",
      visitCount: 1,
      hasCustomerSession: false,
      hasDeferredPrompt: true,
      isIos: false,
      dismissed: false,
      standalone: false,
    };

    expect(shouldOfferPwaInstall(base)).toBe(false);
    expect(shouldOfferPwaInstall({ ...base, visitCount: 2 })).toBe(true);
    expect(shouldOfferPwaInstall({ ...base, hasCustomerSession: true })).toBe(true);
    expect(shouldOfferPwaInstall({ ...base, visitCount: 2, pathname: "/checkout" })).toBe(false);
    expect(shouldOfferPwaInstall({ ...base, visitCount: 2, standalone: true })).toBe(false);
    expect(shouldOfferPwaInstall({ ...base, visitCount: 2, dismissed: true })).toBe(false);
    expect(
      shouldOfferPwaInstall({
        ...base,
        visitCount: 2,
        hasDeferredPrompt: false,
        isIos: true,
      }),
    ).toBe(true);
    expect(
      shouldOfferPwaInstall({
        ...base,
        visitCount: 2,
        hasDeferredPrompt: false,
        isIos: false,
      }),
    ).toBe(false);
  });

  it("does not offer in development", () => {
    expect(
      shouldOfferPwaInstall({
        isProd: false,
        pathname: "/shop",
        visitCount: 5,
        hasCustomerSession: true,
        hasDeferredPrompt: true,
        isIos: false,
      }),
    ).toBe(false);
  });
});
