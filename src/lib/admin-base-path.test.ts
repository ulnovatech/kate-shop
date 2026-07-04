import { describe, expect, it } from "vitest";
import { ADMIN_BASE_PATH, ADMIN_LOGIN_PATH, adminUrl, SHOP_ORIGIN } from "@/lib/admin-base-path";

describe("adminUrl", () => {
  it("prefixes monolith staff paths with /admin by default", () => {
    expect(ADMIN_BASE_PATH).toBe("/admin");
    expect(adminUrl("/orders")).toBe("/admin/orders");
    expect(ADMIN_LOGIN_PATH).toBe("/admin/login");
  });

  it("exposes a storefront origin for view-shop links", () => {
    expect(SHOP_ORIGIN).toMatch(/^https?:\/\//);
  });
});
