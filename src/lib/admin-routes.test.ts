import { describe, expect, it } from "vitest";
import { isAdminPath, isAdminPublicPath, isStaffOriginPath } from "@/lib/admin-routes";

describe("isAdminPath", () => {
  it("matches /admin and nested staff routes", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/orders")).toBe(true);
    expect(isAdminPath("/admin/categories")).toBe(true);
  });

  it("does not match storefront paths", () => {
    expect(isAdminPath("/shop")).toBe(false);
    expect(isAdminPath("/administrator")).toBe(false);
  });
});

describe("isAdminPublicPath", () => {
  it("allows auth flows without layout guard", () => {
    expect(isAdminPublicPath("/admin/login")).toBe(true);
    expect(isAdminPublicPath("/admin/login-callback")).toBe(true);
    expect(isAdminPublicPath("/admin/setup")).toBe(true);
    expect(isAdminPublicPath("/admin/accept-invite")).toBe(true);
    expect(isAdminPublicPath("/admin/install")).toBe(true);
  });

  it("requires guard for operational routes", () => {
    expect(isAdminPublicPath("/admin")).toBe(false);
    expect(isAdminPublicPath("/admin/orders")).toBe(false);
  });
});

describe("isStaffOriginPath", () => {
  it("treats admin subdomain as staff-only", () => {
    expect(isStaffOriginPath("/orders", "admin.example.com")).toBe(true);
    expect(isStaffOriginPath("/", "admin.example.com")).toBe(true);
  });

  it("falls back to pathname on shop origin", () => {
    expect(isStaffOriginPath("/admin/login", "shop.example.com")).toBe(true);
    expect(isStaffOriginPath("/shop", "shop.example.com")).toBe(false);
  });
});
