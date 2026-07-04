import { describe, expect, it, vi } from "vitest";
import {
  normalizeStaffRelativePath,
  queryKeysForAdminRefresh,
} from "@/lib/admin-refresh";

vi.mock("@/lib/admin-base-path", () => ({
  ADMIN_BASE_PATH: "/",
}));

describe("normalizeStaffRelativePath", () => {
  it("normalizes root paths", () => {
    expect(normalizeStaffRelativePath("/")).toBe("/");
    expect(normalizeStaffRelativePath("/orders")).toBe("/orders");
    expect(normalizeStaffRelativePath("/orders/")).toBe("/orders");
  });
});

describe("queryKeysForAdminRefresh", () => {
  it("maps dashboard routes", () => {
    const keys = queryKeysForAdminRefresh("/");
    expect(keys).toContain("admin-stats");
    expect(keys).toContain("admin-nav-badges");
  });

  it("maps orders list and detail", () => {
    expect(queryKeysForAdminRefresh("/orders")).toContain("admin-orders");
    expect(queryKeysForAdminRefresh("/orders/abc")).toContain("admin-order");
  });

  it("maps products routes", () => {
    expect(queryKeysForAdminRefresh("/products")).toContain("admin-products");
    expect(queryKeysForAdminRefresh("/products/new")).toContain("admin-products");
  });

  it("maps inventory route", () => {
    const keys = queryKeysForAdminRefresh("/inventory");
    expect(keys).toContain("admin-inventory");
    expect(keys).toContain("admin-categories");
    expect(keys).toContain("admin-products");
  });
});
