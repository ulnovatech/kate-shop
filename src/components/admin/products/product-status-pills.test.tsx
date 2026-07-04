import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductStatusPills } from "./product-status-pills";
import type { AdminProduct } from "./types";

const baseProduct: AdminProduct = {
  id: "1",
  name: "Test",
  sku: null,
  price: 1000,
  stock_quantity: 10,
  available_stock: 10,
  low_stock_threshold: 5,
  is_visible: true,
  is_featured: false,
  archived_at: null,
  categories: null,
  product_images: [],
};

describe("ProductStatusPills", () => {
  it("shows visible and low stock pills", () => {
    render(<ProductStatusPills product={{ ...baseProduct, available_stock: 3 }} />);
    expect(screen.getByText("Visible")).toBeInTheDocument();
    expect(screen.getByText("Low stock")).toBeInTheDocument();
  });

  it("shows archived and hidden when archived", () => {
    render(
      <ProductStatusPills
        product={{ ...baseProduct, archived_at: "2026-01-01T00:00:00Z", is_visible: false }}
      />,
    );
    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(screen.getByText("Hidden")).toBeInTheDocument();
  });

  it("shows out of stock when zero", () => {
    render(<ProductStatusPills product={{ ...baseProduct, available_stock: 0 }} />);
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });
});
