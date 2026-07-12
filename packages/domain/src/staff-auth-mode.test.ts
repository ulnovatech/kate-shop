import { describe, expect, it } from "vitest";
import {
  coerceStaffRole,
  parseOpenStaffRoleHeader,
  parseStaffAuthRequired,
} from "./staff-auth-mode";

describe("parseStaffAuthRequired", () => {
  it("is false when unset (open mode by default)", () => {
    expect(parseStaffAuthRequired(undefined)).toBe(false);
    expect(parseStaffAuthRequired("")).toBe(false);
    expect(parseStaffAuthRequired(null)).toBe(false);
  });

  it("is true for explicit enable values", () => {
    expect(parseStaffAuthRequired("true")).toBe(true);
    expect(parseStaffAuthRequired("1")).toBe(true);
    expect(parseStaffAuthRequired("yes")).toBe(true);
  });

  it("is false for other values", () => {
    expect(parseStaffAuthRequired("false")).toBe(false);
    expect(parseStaffAuthRequired("no")).toBe(false);
  });
});

describe("coerceStaffRole", () => {
  it("accepts known roles", () => {
    expect(coerceStaffRole("owner")).toBe("owner");
    expect(coerceStaffRole("Admin")).toBe("admin");
    expect(coerceStaffRole("manager")).toBe("manager");
    expect(coerceStaffRole("staff")).toBe("staff");
  });

  it("falls back to staff for unknown slugs", () => {
    expect(coerceStaffRole("cashier")).toBe("staff");
    expect(coerceStaffRole(null)).toBe("staff");
  });
});

describe("parseOpenStaffRoleHeader", () => {
  it("parses header values", () => {
    expect(parseOpenStaffRoleHeader("manager")).toBe("manager");
    expect(parseOpenStaffRoleHeader(undefined)).toBe("staff");
  });
});
