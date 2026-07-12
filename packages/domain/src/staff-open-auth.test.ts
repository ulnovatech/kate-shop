import { describe, expect, it } from "vitest";
import {
  coerceStaffRole,
  parseStaffAuthRequired,
  parseOpenStaffRoleHeader,
  OPEN_STAFF_ACTOR_ID,
} from "@kate/domain/staff-auth-mode";
import { permissionsForRole } from "@kate/domain/rbac";

/**
 * Mirrors open-mode AuthContext construction used by requireStaffAuth when
 * STAFF_AUTH_REQUIRED is unset/false.
 */
function openAuthContext(roleHeader: string | null) {
  const role = parseOpenStaffRoleHeader(roleHeader);
  const permissions = permissionsForRole(role);
  return {
    userId: OPEN_STAFF_ACTOR_ID,
    staffRole: role,
    permissionKeys: permissions.permissionKeys,
    canAccessAdmin: permissions.canAccessAdmin,
  };
}

describe("open-mode staff auth bypass", () => {
  it("defaults to open mode when auth flag unset", () => {
    expect(parseStaffAuthRequired(undefined)).toBe(false);
  });

  it("builds staff context without a bearer session", () => {
    const ctx = openAuthContext(null);
    expect(ctx.userId).toBe(OPEN_STAFF_ACTOR_ID);
    expect(ctx.staffRole).toBe("staff");
    expect(ctx.canAccessAdmin).toBe(true);
  });

  it("honors open role header for manager permissions", () => {
    const ctx = openAuthContext("manager");
    expect(ctx.staffRole).toBe("manager");
    expect(ctx.permissionKeys.size).toBeGreaterThan(0);
  });

  it("requires auth again only when flag explicitly enabled", () => {
    expect(parseStaffAuthRequired("true")).toBe(true);
    expect(coerceStaffRole("owner")).toBe("owner");
  });
});
