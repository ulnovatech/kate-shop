import { describe, expect, it } from "vitest";
import { isRecycled, recycleEntityLabel } from "@/lib/recycle";

describe("isRecycled", () => {
  it("detects soft-deleted rows", () => {
    expect(isRecycled({ deleted_at: "2026-06-01T00:00:00Z" })).toBe(true);
    expect(isRecycled({ deleted_at: null })).toBe(false);
    expect(isRecycled({})).toBe(false);
  });
});

describe("recycleEntityLabel", () => {
  it("labels entity types", () => {
    expect(recycleEntityLabel("product")).toBe("Product");
    expect(recycleEntityLabel("category")).toBe("Category");
  });
});
