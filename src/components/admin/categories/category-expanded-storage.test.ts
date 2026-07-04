import { beforeEach, describe, expect, it } from "vitest";
import {
  readExpandedIds,
  writeExpandedIds,
} from "@/components/admin/categories/category-expanded-storage";

describe("category expanded storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("round-trips expanded ids", () => {
    writeExpandedIds(new Set(["a", "b"]));
    expect(readExpandedIds()).toEqual(new Set(["a", "b"]));
  });

  it("returns an empty set when storage is missing", () => {
    expect(readExpandedIds()).toEqual(new Set());
  });

  it("returns an empty set for invalid json", () => {
    sessionStorage.setItem("admin-categories-expanded", "not-json");
    expect(readExpandedIds()).toEqual(new Set());
  });
});
