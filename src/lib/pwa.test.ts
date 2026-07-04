import { describe, expect, it } from "vitest";
import { buildAdminWebManifest, buildWebManifest, isOfflineBlockedPath } from "@/lib/pwa";

describe("isOfflineBlockedPath", () => {
  it("blocks admin, checkout, and order routes", () => {
    expect(isOfflineBlockedPath("/checkout")).toBe(true);
    expect(isOfflineBlockedPath("/order/KS-2026-000001")).toBe(true);
    expect(isOfflineBlockedPath("/admin/orders")).toBe(true);
  });

  it("allows storefront browsing", () => {
    expect(isOfflineBlockedPath("/shop")).toBe(false);
    expect(isOfflineBlockedPath("/product/ring-gold")).toBe(false);
    expect(isOfflineBlockedPath("/")).toBe(false);
  });
});

describe("buildWebManifest", () => {
  it("uses shop name and theme colors", () => {
    const manifest = buildWebManifest({
      shopName: "Kate Shop",
      description: "Jewelry in Kampala",
    });
    expect(manifest.name).toBe("Kate Shop");
    expect(manifest.short_name).toBe("Kate Shop");
    expect(manifest.theme_color).toBe("#064e3b");
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});

describe("buildAdminWebManifest", () => {
  it("scopes staff install with Kate Admin identity", () => {
    const manifest = buildAdminWebManifest();
    expect(manifest.name).toBe("Kate Admin");
    expect(manifest.short_name).toBe("Kate Admin");
    expect(manifest.start_url).toBe("/admin");
    expect(manifest.scope).toBe("/admin");
    expect(manifest.display).toBe("standalone");
    expect(manifest.id).toBe("/admin");
    expect(manifest.icons[0]?.src).toBe("/admin-icon.svg");
    expect(manifest.categories).toContain("business");
  });
});
