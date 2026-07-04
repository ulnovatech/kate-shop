import { describe, expect, it } from "vitest";
import {
  buildPaginatedResult,
  clampPage,
  normalizeListPagination,
  paginationRange,
  totalPages,
} from "./list-pagination";

describe("list-pagination", () => {
  it("computes range for page 2", () => {
    expect(paginationRange(2, 25)).toEqual({
      page: 2,
      pageSize: 25,
      from: 25,
      to: 49,
    });
  });

  it("clamps page size to max", () => {
    expect(paginationRange(1, 500).pageSize).toBe(100);
  });

  it("returns legacy limit when page omitted", () => {
    expect(normalizeListPagination()).toEqual({ limit: 200 });
  });

  it("returns range when page provided", () => {
    expect(normalizeListPagination(3, 10)).toMatchObject({ page: 3, pageSize: 10, from: 20 });
  });

  it("builds paginated result metadata", () => {
    const result = buildPaginatedResult(["a", "b"], 42, 2, 10);
    expect(result.totalPages).toBe(5);
    expect(result.items).toHaveLength(2);
  });

  it("clamps page to total pages", () => {
    expect(clampPage(99, 3)).toBe(3);
    expect(clampPage(0, 3)).toBe(1);
  });

  it("calculates total pages", () => {
    expect(totalPages(0, 25)).toBe(0);
    expect(totalPages(26, 25)).toBe(2);
  });
});
