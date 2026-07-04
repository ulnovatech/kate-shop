import { describe, expect, it } from "vitest";
import { SYSTEM_ROLE_PERMISSIONS } from "@/lib/permissions";
import { permissionsFromStaffAccess } from "@/lib/rbac";

describe("permissionsFromStaffAccess", () => {
  it("staff preset can view catalog but not settings", () => {
    const perms = permissionsFromStaffAccess({
      userId: "u1",
      roleId: "r1",
      roleSlug: "staff",
      roleName: "Staff",
      isSystem: true,
      isLocked: false,
      permissions: [...SYSTEM_ROLE_PERMISSIONS.staff],
    });

    expect(perms.canManageCatalog).toBe(true);
    expect(perms.canManageSettings).toBe(false);
    expect(perms.permissionKeys.has("catalog.delete")).toBe(false);
  });

  it("accountant can manage orders via payments view but not catalog", () => {
    const perms = permissionsFromStaffAccess({
      userId: "u2",
      roleId: "r2",
      roleSlug: "accountant",
      roleName: "Accountant",
      isSystem: true,
      isLocked: false,
      permissions: [...SYSTEM_ROLE_PERMISSIONS.accountant],
    });

    expect(perms.canManageCatalog).toBe(false);
    expect(perms.canManageOrders).toBe(true);
    expect(perms.permissionKeys.has("payments.create")).toBe(true);
  });

  it("stock controller can edit catalog", () => {
    const perms = permissionsFromStaffAccess({
      userId: "u3",
      roleId: "r3",
      roleSlug: "stock_controller",
      roleName: "Stock Controller",
      isSystem: true,
      isLocked: false,
      permissions: [...SYSTEM_ROLE_PERMISSIONS.stock_controller],
    });

    expect(perms.canManageCatalog).toBe(true);
    expect(perms.permissionKeys.has("catalog.edit")).toBe(true);
    expect(perms.permissionKeys.has("catalog.delete")).toBe(false);
  });
});
