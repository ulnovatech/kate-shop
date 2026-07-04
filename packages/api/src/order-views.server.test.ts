import { describe, expect, it } from "vitest";
import { countUnopenedOrders } from "@kate/api/order-views.server";

describe("countUnopenedOrders", () => {
  it("counts active orders without a view record", () => {
    expect(countUnopenedOrders(["a", "b", "c"], ["b"])).toBe(2);
  });

  it("returns zero when all active orders are viewed", () => {
    expect(countUnopenedOrders(["a", "b"], ["a", "b"])).toBe(0);
  });

  it("returns zero for no active orders", () => {
    expect(countUnopenedOrders([], ["a"])).toBe(0);
  });
});
