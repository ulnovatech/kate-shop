import { describe, expect, it } from "vitest";
import {
  ADMIN_PROTECTED_ROUTE_CATALOG,
  ADMIN_PUBLIC_ROUTE_IDS,
  ADMIN_ROUTE_CATALOG,
  adminRoutesInArea,
} from "./admin-route-catalog";

describe("ADMIN_ROUTE_CATALOG", () => {
  it("lists 21 staff routes for C14 parity", () => {
    expect(ADMIN_ROUTE_CATALOG).toHaveLength(21);
  });

  it("has unique ids and paths", () => {
    const ids = ADMIN_ROUTE_CATALOG.map((r) => r.id);
    const paths = ADMIN_ROUTE_CATALOG.map((r) => r.path);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("covers all blueprint areas", () => {
    expect(adminRoutesInArea("auth")).toHaveLength(4);
    expect(adminRoutesInArea("home")).toHaveLength(1);
    expect(adminRoutesInArea("catalog")).toHaveLength(4);
    expect(adminRoutesInArea("orders")).toHaveLength(3);
    expect(adminRoutesInArea("money")).toHaveLength(2);
    expect(adminRoutesInArea("ops")).toHaveLength(4);
    expect(adminRoutesInArea("team")).toHaveLength(3);
  });

  it("marks public auth routes", () => {
    expect(ADMIN_PUBLIC_ROUTE_IDS).toEqual(["login", "join", "setup", "accept-invite"]);
    expect(ADMIN_PROTECTED_ROUTE_CATALOG).toHaveLength(17);
  });
});
