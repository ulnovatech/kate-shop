import { describe, expect, it } from "vitest";
import { hasPermissionKey, SYSTEM_ROLE_PERMISSIONS, permissionKey } from "@/lib/permissions";

describe("hasPermissionKey", () => {
  it("checks module.action membership", () => {
    const perms = new Set(SYSTEM_ROLE_PERMISSIONS.staff);
    expect(hasPermissionKey(perms, "catalog", "view")).toBe(true);
    expect(hasPermissionKey(perms, "catalog", "delete")).toBe(false);
    expect(hasPermissionKey(perms, "payments", "create")).toBe(true);
  });
});

describe("SYSTEM_ROLE_PERMISSIONS", () => {
  it("staff cannot delete catalog items", () => {
    expect(SYSTEM_ROLE_PERMISSIONS.staff).not.toContain(permissionKey("catalog", "delete"));
    expect(SYSTEM_ROLE_PERMISSIONS.staff).not.toContain(permissionKey("settings", "manage"));
  });

  it("accountant has payments but not catalog edit", () => {
    expect(SYSTEM_ROLE_PERMISSIONS.accountant).toContain(permissionKey("payments", "approve"));
    expect(SYSTEM_ROLE_PERMISSIONS.accountant).not.toContain(permissionKey("catalog", "edit"));
  });

  it("delivery rider can approve orders only", () => {
    expect(SYSTEM_ROLE_PERMISSIONS.delivery_rider).toEqual([
      permissionKey("orders", "view"),
      permissionKey("orders", "approve"),
    ]);
  });

  it("owner has all keys", () => {
    expect(SYSTEM_ROLE_PERMISSIONS.owner.length).toBeGreaterThan(20);
  });
});
