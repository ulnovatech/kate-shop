import { describe, expect, it } from "vitest";
import { isCodProvider, movePaymentMethodInList, sortPaymentMethods } from "@/lib/payment-methods";

describe("sortPaymentMethods", () => {
  it("orders by sort_order then label", () => {
    const sorted = sortPaymentMethods([
      { sort_order: 2, label: "B", id: "2" },
      { sort_order: 0, label: "C", id: "3" },
      { sort_order: 0, label: "A", id: "1" },
    ]);
    expect(sorted.map((m) => m.id)).toEqual(["1", "3", "2"]);
  });
});

describe("isCodProvider", () => {
  it("identifies cash on delivery", () => {
    expect(isCodProvider("cash_on_delivery")).toBe(true);
    expect(isCodProvider("mtn_momo")).toBe(false);
  });
});

describe("movePaymentMethodInList", () => {
  const methods = [
    { id: "a", sort_order: 0 },
    { id: "b", sort_order: 1 },
    { id: "c", sort_order: 2 },
  ];

  it("swaps down and reindexes sort_order", () => {
    const next = movePaymentMethodInList(methods, "b", "down");
    expect(next.map((m) => m.id)).toEqual(["a", "c", "b"]);
    expect(next.map((m) => m.sort_order)).toEqual([0, 1, 2]);
  });

  it("no-ops at boundaries", () => {
    expect(movePaymentMethodInList(methods, "a", "up")).toEqual(methods);
    expect(movePaymentMethodInList(methods, "c", "down")).toEqual(methods);
  });
});
