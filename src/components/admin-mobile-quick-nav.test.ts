import { describe, expect, it } from "vitest";
import { permissionsForRole } from "@/lib/rbac";
import { adminMobileQuickNavVisible } from "@/components/admin-mobile-quick-nav";

describe("adminMobileQuickNavVisible", () => {
  it("is true for staff with dashboard access", () => {
    expect(adminMobileQuickNavVisible(permissionsForRole("owner"))).toBe(true);
  });

  it("is true when only catalog access would show create", () => {
    const perms = permissionsForRole("staff");
    expect(adminMobileQuickNavVisible(perms)).toBe(true);
  });
});
