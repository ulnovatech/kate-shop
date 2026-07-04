import { describe, expect, it } from "vitest";
import { humanStockAvailability } from "@/lib/human-labels";
import { isInStock, maxPurchasable } from "@/lib/inventory";

describe("product card stock badges", () => {
  it("shows low stock copy when only a few remain", () => {
    const maxQty = maxPurchasable({ available_stock: 2 });
    const copy = humanStockAvailability(maxQty);
    expect(copy.tone).toBe("low");
    expect(copy.label).toContain("2");
  });

  it("treats zero stock as out", () => {
    expect(isInStock({ available_stock: 0 })).toBe(false);
  });
});
