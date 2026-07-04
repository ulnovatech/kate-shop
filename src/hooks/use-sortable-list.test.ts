import { describe, expect, it } from "vitest";
import { reorderIds } from "@/hooks/use-sortable-list";

describe("reorderIds", () => {
  const ids = ["a", "b", "c", "d"];

  it("moves an item down one position", () => {
    expect(reorderIds(ids, "b", 2)).toEqual(["a", "c", "b", "d"]);
  });

  it("moves an item up one position", () => {
    expect(reorderIds(ids, "c", 1)).toEqual(["a", "c", "b", "d"]);
  });

  it("returns the same array when index is unchanged", () => {
    expect(reorderIds(ids, "b", 1)).toBe(ids);
  });

  it("returns the same array when id is missing", () => {
    expect(reorderIds(ids, "missing", 0)).toBe(ids);
  });
});
