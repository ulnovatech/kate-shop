import { describe, expect, it, vi } from "vitest";
import { loadCheckoutAutofill, saveCheckoutAutofill } from "@/lib/checkout-autofill";
import {
  customerOrderNextStep,
  humanPaymentStatus,
  humanStockAvailability,
  orderTrackingStepIndex,
} from "@/lib/human-labels";
import { sortProducts } from "@/lib/shop-sort";
import type { ProductCardData } from "@/components/product-card";

const sampleProducts: ProductCardData[] = [
  {
    id: "1",
    name: "Bangle",
    slug: "bangle",
    price: 50000,
    stock_quantity: 5,
    product_images: [],
  },
  {
    id: "2",
    name: "Ring",
    slug: "ring",
    price: 30000,
    stock_quantity: 2,
    product_images: [],
  },
];

describe("shop sort", () => {
  it("sorts by price ascending", () => {
    const sorted = sortProducts(sampleProducts, "price_asc");
    expect(sorted.map((p) => p.name)).toEqual(["Ring", "Bangle"]);
  });

  it("sorts by name", () => {
    const sorted = sortProducts(sampleProducts, "name_asc");
    expect(sorted.map((p) => p.name)).toEqual(["Bangle", "Ring"]);
  });
});

describe("storefront human labels", () => {
  it("formats stock availability", () => {
    expect(humanStockAvailability(0).tone).toBe("out");
    expect(humanStockAvailability(2).label).toContain("Only 2 left");
    expect(humanStockAvailability(10).tone).toBe("available");
  });

  it("formats payment status for customers", () => {
    expect(humanPaymentStatus("pending")).toBe("Waiting for payment");
    expect(humanPaymentStatus("paid")).toBe("Paid in full");
  });

  it("suggests next customer step", () => {
    expect(customerOrderNextStep("awaiting_stock_confirmation", "pending", 1000)).toContain(
      "checking stock",
    );
    expect(customerOrderNextStep("shipped", "paid", 0)).toContain("on the way");
  });

  it("maps order status to tracker index", () => {
    expect(orderTrackingStepIndex("awaiting_stock_confirmation", "pending")).toBe(1);
    expect(orderTrackingStepIndex("shipped", "paid")).toBe(4);
    expect(orderTrackingStepIndex("delivered", "paid")).toBe(5);
  });
});

describe("checkout autofill", () => {
  it("round-trips through localStorage", () => {
    const storage = new Map<string, string>();
    const getItem = (key: string) => storage.get(key) ?? null;
    const setItem = (key: string, value: string) => {
      storage.set(key, value);
    };

    vi.stubGlobal("localStorage", { getItem, setItem });

    saveCheckoutAutofill({
      customer_name: "Jane",
      phone: "0700123456",
      email: "jane@example.com",
      area: "Kololo",
      address: "Plot 1",
    });

    expect(loadCheckoutAutofill()).toMatchObject({
      customer_name: "Jane",
      phone: "0700123456",
      area: "Kololo",
    });

    vi.unstubAllGlobals();
  });
});
