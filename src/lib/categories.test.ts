import { describe, expect, it } from "vitest";
import {
  buildCategoryTree,
  categoryDepth,
  flattenCategoryTreeForSelect,
  getCategoryBreadcrumb,
  getDescendantIds,
  getRootCategories,
  validParentOptions,
  type CategoryRecord,
} from "@/lib/categories";

const sample: CategoryRecord[] = [
  { id: "1", name: "Jewelry", slug: "jewelry", parent_id: null, sort_order: 0 },
  { id: "2", name: "Earrings", slug: "earrings", parent_id: "1", sort_order: 0 },
  { id: "3", name: "Studs", slug: "studs", parent_id: "2", sort_order: 0 },
  { id: "4", name: "Watches", slug: "watches", parent_id: null, sort_order: 1 },
];

describe("buildCategoryTree", () => {
  it("nests children under parents", () => {
    const tree = buildCategoryTree(sample);
    expect(tree).toHaveLength(2);
    expect(tree[0].children[0].slug).toBe("earrings");
    expect(tree[0].children[0].children[0].slug).toBe("studs");
  });
});

describe("categoryDepth", () => {
  it("returns 1 for roots and 3 for deepest node", () => {
    expect(categoryDepth("1", sample)).toBe(1);
    expect(categoryDepth("3", sample)).toBe(3);
  });
});

describe("getDescendantIds", () => {
  it("includes node and all descendants", () => {
    expect(getDescendantIds("1", sample).sort()).toEqual(["1", "2", "3"]);
    expect(getDescendantIds("2", sample)).toEqual(["2", "3"]);
  });
});

describe("getRootCategories", () => {
  it("returns only top-level categories", () => {
    expect(getRootCategories(sample).map((c) => c.slug)).toEqual(["jewelry", "watches"]);
  });
});

describe("getCategoryBreadcrumb", () => {
  it("walks from leaf to root", () => {
    expect(getCategoryBreadcrumb("studs", sample).map((c) => c.slug)).toEqual([
      "jewelry",
      "earrings",
      "studs",
    ]);
  });
});

describe("flattenCategoryTreeForSelect", () => {
  it("preserves depth for indented labels", () => {
    const options = flattenCategoryTreeForSelect(buildCategoryTree(sample));
    expect(options.find((o) => o.id === "3")?.depth).toBe(3);
  });
});

describe("validParentOptions", () => {
  it("excludes self and descendants and depth-3 nodes", () => {
    const parents = validParentOptions(sample, "1");
    expect(parents.map((c) => c.id)).toEqual(["4"]);
    expect(validParentOptions(sample, "2").map((c) => c.id)).toEqual(["1", "4"]);
  });
});
