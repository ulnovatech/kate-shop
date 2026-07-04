import { describe, expect, it } from "vitest";
import {
  isInStock,
  maxPurchasable,
  shouldFulfillInventory,
  shouldReleaseInventory,
} from "@/lib/inventory";
import { isLowStock, stockLabel } from "@/lib/catalog";

describe("stock helpers", () => {
  it("detects in-stock and max purchasable", () => {
    expect(isInStock({ available_stock: 3 })).toBe(true);
    expect(isInStock({ available_stock: 0 })).toBe(false);
    expect(maxPurchasable({ available_stock: 5 })).toBe(5);
    expect(maxPurchasable({ available_stock: 0 })).toBe(0);
  });

  it("labels stock states", () => {
    expect(stockLabel(0, 5)).toBe("Out of stock");
    expect(stockLabel(3, 5)).toBe("Low stock");
    expect(stockLabel(10, 5)).toBe("In stock");
    expect(isLowStock(3, 5)).toBe(true);
    expect(isLowStock(0, 5)).toBe(false);
  });
});

describe("inventory order hooks", () => {
  it("releases on cancel, fulfills on delivered", () => {
    expect(shouldReleaseInventory("cancelled")).toBe(true);
    expect(shouldReleaseInventory("confirmed")).toBe(false);
    expect(shouldFulfillInventory("delivered")).toBe(true);
    expect(shouldFulfillInventory("shipped")).toBe(false);
  });
});
