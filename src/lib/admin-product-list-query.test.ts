import { describe, expect, it, vi } from "vitest";
import { applyAdminProductListFilters } from "./admin-product-list-query";

type MockQuery = {
  calls: string[];
  is(column: string, value: null): MockQuery;
  not(column: string, operator: string, value: null): MockQuery;
  eq(column: string, value: string | boolean): MockQuery;
  in(column: string, values: string[]): MockQuery;
  gt(column: string, value: number): MockQuery;
  gte(column: string, value: number): MockQuery;
  lte(column: string, value: number): MockQuery;
  or(filters: string): MockQuery;
  order(column: string, options: { ascending: boolean }): MockQuery;
  range(from: number, to: number): MockQuery;
};

function createMockQuery(): MockQuery {
  const mock: MockQuery = {
    calls: [],
    is(column, value) {
      mock.calls.push(`is:${column}:${value}`);
      return mock;
    },
    not(column, operator, value) {
      mock.calls.push(`not:${column}:${operator}:${value}`);
      return mock;
    },
    eq(column, value) {
      mock.calls.push(`eq:${column}:${String(value)}`);
      return mock;
    },
    in(column, values) {
      mock.calls.push(`in:${column}:${values.join(",")}`);
      return mock;
    },
    gt(column, value) {
      mock.calls.push(`gt:${column}:${value}`);
      return mock;
    },
    gte(column, value) {
      mock.calls.push(`gte:${column}:${value}`);
      return mock;
    },
    lte(column, value) {
      mock.calls.push(`lte:${column}:${value}`);
      return mock;
    },
    or(filters) {
      mock.calls.push(`or:${filters}`);
      return mock;
    },
    order(column, options) {
      mock.calls.push(`order:${column}:${options.ascending}`);
      return mock;
    },
    range(from, to) {
      mock.calls.push(`range:${from}:${to}`);
      return mock;
    },
  };
  return mock;
}

describe("admin-product-list-query", () => {
  it("applies active, category, and search filters", () => {
    const qb = createMockQuery();
    applyAdminProductListFilters(qb, {
      q: "kate",
      categoryId: "cat-1",
      listFilter: "active",
      priceMin: "",
      priceMax: "",
      stockFilter: "all",
      featured: "all",
    });

    expect(qb.calls).toEqual([
      "is:deleted_at:null",
      "is:archived_at:null",
      "eq:category_id:cat-1",
      "or:name.ilike.%kate%,sku.ilike.%kate%",
      "order:updated_at:false",
    ]);
  });

  it("applies category scope ids when provided", () => {
    const qb = createMockQuery();
    applyAdminProductListFilters(
      qb,
      {
        q: "",
        categoryId: "parent",
        listFilter: "all",
        priceMin: "",
        priceMax: "",
        stockFilter: "all",
        featured: "all",
      },
      { categoryScopeIds: ["parent", "child-1", "child-2"] },
    );

    expect(qb.calls).toContain("in:category_id:parent,child-1,child-2");
  });

  it("applies archived filter", () => {
    const qb = createMockQuery();
    applyAdminProductListFilters(qb, {
      q: "",
      categoryId: "all",
      listFilter: "archived",
      priceMin: "",
      priceMax: "",
      stockFilter: "all",
      featured: "all",
    });

    expect(qb.calls).toContain("not:archived_at:is:null");
  });
});
