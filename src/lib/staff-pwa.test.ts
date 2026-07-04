import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_PWA_ICON,
  evictShopPwaFromStaffOrigin,
  isStaffWebHost,
  shouldEvictShopServiceWorker,
  staffOfflineBannerMessage,
  staffPwaManifestId,
} from "@/lib/staff-pwa";

describe("isStaffWebHost", () => {
  it("detects admin subdomains", () => {
    expect(isStaffWebHost("admin.example.com")).toBe(true);
    expect(isStaffWebHost("admin.kate.shop")).toBe(true);
    expect(isStaffWebHost("shop.example.com")).toBe(false);
    expect(isStaffWebHost("www.example.com")).toBe(false);
  });
});

describe("shouldEvictShopServiceWorker", () => {
  it("evicts on admin subdomain", () => {
    expect(shouldEvictShopServiceWorker("admin.example.com")).toBe(true);
  });
});

describe("staffPwaManifestId", () => {
  it("defaults to monolith /admin scope in tests", () => {
    expect(staffPwaManifestId()).toBe("/admin");
  });
});

describe("staffOfflineBannerMessage", () => {
  it("mentions Kate Admin", () => {
    expect(staffOfflineBannerMessage()).toContain("Kate Admin");
  });
});

describe("evictShopPwaFromStaffOrigin", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("unregisters workers and clears caches on staff host", async () => {
    const unregister = vi.fn().mockResolvedValue(true);
    const getRegistrations = vi.fn().mockResolvedValue([{ unregister }]);
    const deleteCache = vi.fn().mockResolvedValue(true);
    const keys = vi.fn().mockResolvedValue(["workbox-precache-v2", "images"]);

    vi.stubGlobal("navigator", {
      serviceWorker: { getRegistrations },
    });
    vi.stubGlobal("caches", { keys, delete: deleteCache });

    await evictShopPwaFromStaffOrigin("admin.example.com");

    expect(getRegistrations).toHaveBeenCalled();
    expect(unregister).toHaveBeenCalled();
    expect(deleteCache).toHaveBeenCalledTimes(2);
  });

  it("no-ops on shop host", async () => {
    const getRegistrations = vi.fn();
    vi.stubGlobal("navigator", {
      serviceWorker: { getRegistrations },
    });

    await evictShopPwaFromStaffOrigin("shop.example.com");
    expect(getRegistrations).not.toHaveBeenCalled();
  });
});

describe("ADMIN_PWA_ICON", () => {
  it("uses dedicated staff icon path", () => {
    expect(ADMIN_PWA_ICON).toBe("/admin-icon.svg");
  });
});
