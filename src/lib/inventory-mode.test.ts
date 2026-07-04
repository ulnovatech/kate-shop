import { describe, expect, it } from "vitest";
import {
  checkoutAllowedWhenShort,
  inventoryModeLabel,
  isBackorderMode,
} from "@/lib/inventory-mode";

describe("inventoryModeLabel", () => {
  it("describes modes", () => {
    expect(inventoryModeLabel("strict")).toContain("Strict");
    expect(inventoryModeLabel("backorder")).toContain("Backorder");
  });
});

describe("isBackorderMode", () => {
  it("detects backorder setting", () => {
    expect(isBackorderMode("backorder")).toBe(true);
    expect(isBackorderMode("strict")).toBe(false);
    expect(checkoutAllowedWhenShort("backorder")).toBe(true);
    expect(checkoutAllowedWhenShort("strict")).toBe(false);
  });
});
