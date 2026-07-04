import { describe, expect, it } from "vitest";
import { ROLE_TEMPLATES, permissionKeysForRoleTemplate } from "@/lib/role-templates";

describe("role templates", () => {
  it("excludes owner from presets", () => {
    expect(ROLE_TEMPLATES.some((t) => t.slug === "owner")).toBe(false);
    expect(ROLE_TEMPLATES.length).toBeGreaterThanOrEqual(5);
  });

  it("returns permission keys for manager template", () => {
    const keys = permissionKeysForRoleTemplate("manager");
    expect(keys).toContain("orders.view");
    expect(keys).not.toContain("settings.manage");
  });
});
