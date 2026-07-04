import { describe, expect, it } from "vitest";
import {
  ADMIN_ORDER_LIST_DEFAULTS,
  ADMIN_PRODUCT_LIST_DEFAULTS,
  adminOrderFiltersToApi,
  buildListQueryKey,
  cleanSearchParams,
  countActiveFilters,
  parseAdminOrderListFilters,
  parseAdminProductListFilters,
  parseAdminNotificationListFilters,
  serializeAdminNotificationListFilters,
  parseAdminAuditListFilters,
  serializeAdminAuditListFilters,
  serializeAdminOrderListFilters,
  serializeAdminProductListFilters,
} from "./list-filters";

describe("list-filters", () => {
  it("cleans empty search params", () => {
    expect(cleanSearchParams({ q: "", status: "active", page: undefined })).toEqual({
      status: "active",
    });
  });

  it("counts active filters against defaults", () => {
    expect(
      countActiveFilters(
        { ...ADMIN_PRODUCT_LIST_DEFAULTS, q: "hat", listFilter: "archived" },
        ADMIN_PRODUCT_LIST_DEFAULTS,
      ),
    ).toBe(2);
  });

  it("parses and serializes product list filters", () => {
    const parsed = parseAdminProductListFilters({
      q: "  dress ",
      category: "uuid-1",
      status: "archived",
      page: 2,
    });
    expect(parsed).toEqual({
      q: "dress",
      categoryId: "uuid-1",
      listFilter: "archived",
      page: 2,
      priceMin: "",
      priceMax: "",
      stockFilter: "all",
      featured: "all",
    });

    expect(serializeAdminProductListFilters(parsed)).toEqual({
      q: "dress",
      category: "uuid-1",
      status: "archived",
      page: 2,
    });
  });

  it("omits default product search fields when serializing", () => {
    expect(serializeAdminProductListFilters(ADMIN_PRODUCT_LIST_DEFAULTS)).toEqual({});
  });

  it("parses and serializes order list filters", () => {
    const parsed = parseAdminOrderListFilters({
      q: "ORD-1",
      status: "confirmed",
      from: "2026-01-01",
      to: "2026-01-31",
    });
    expect(parsed.status).toBe("confirmed");
    expect(serializeAdminOrderListFilters(parsed)).toEqual({
      q: "ORD-1",
      status: "confirmed",
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });

  it("maps order filters to API payload", () => {
    expect(
      adminOrderFiltersToApi({
        ...ADMIN_ORDER_LIST_DEFAULTS,
        q: "jane",
        status: "confirmed",
      }),
    ).toEqual({
      query: "jane",
      status: "confirmed",
      date_from: undefined,
      date_to: undefined,
      page: 1,
    });
  });

  it("builds stable query keys", () => {
    const key = buildListQueryKey("admin-products", { q: "a", status: "active" });
    expect(key).toEqual([
      "admin-products",
      { q: "a", status: "active" },
    ]);
  });

  it("parses notification list filters with pending default", () => {
    expect(parseAdminNotificationListFilters({})).toEqual({ status: "pending" });
    expect(serializeAdminNotificationListFilters({ status: "sent" })).toEqual({ status: "sent" });
  });

  it("parses and serializes audit list filters", () => {
    const parsed = parseAdminAuditListFilters({
      q: "prod-1",
      action: "product_updated",
      entity: "product",
      from: "2026-01-01",
    });
    expect(parsed.entityType).toBe("product");
    expect(serializeAdminAuditListFilters(parsed)).toEqual({
      q: "prod-1",
      action: "product_updated",
      entity: "product",
      from: "2026-01-01",
    });
  });
});
