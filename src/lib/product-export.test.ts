import { describe, expect, it } from "vitest";
import { productsToCsv } from "@/lib/product-export";
import type { AdminProduct } from "@/components/admin/products/types";

const sample: AdminProduct = {
  id: "1",
  name: "Test Product",
  sku: "SKU-1",
  price: 10000,
  stock_quantity: 5,
  available_stock: 5,
  low_stock_threshold: 2,
  is_visible: true,
  is_featured: false,
  archived_at: null,
  categories: { name: "Bags" },
  product_images: [],
};

describe("productsToCsv", () => {
  it("exports header and product row", () => {
    const csv = productsToCsv([sample]);
    expect(csv).toContain("name,sku,price_ugx");
    expect(csv).toContain("Test Product,SKU-1,10000");
  });
});
