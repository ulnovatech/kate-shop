import { describe, expect, it } from "vitest";
import {
  allowedNextStatuses,
  isValidOrderReference,
  isValidOrderTransition,
  ordersToCsv,
} from "@/lib/orders";

describe("isValidOrderReference", () => {
  it("accepts KS-YYYY-NNNNNN", () => {
    expect(isValidOrderReference("KS-2026-000042")).toBe(true);
    expect(isValidOrderReference("KS-2025-123456")).toBe(true);
  });

  it("rejects malformed references", () => {
    expect(isValidOrderReference("KS-26-42")).toBe(false);
    expect(isValidOrderReference("ORDER-2026-000001")).toBe(false);
    expect(isValidOrderReference("")).toBe(false);
  });
});

describe("order workflow transitions", () => {
  it("allows the happy path", () => {
    expect(isValidOrderTransition("awaiting_payment", "confirmed")).toBe(true);
    expect(isValidOrderTransition("confirmed", "packed")).toBe(true);
    expect(isValidOrderTransition("packed", "shipped")).toBe(true);
    expect(isValidOrderTransition("shipped", "delivered")).toBe(true);
  });

  it("allows cancel from active steps", () => {
    expect(isValidOrderTransition("awaiting_payment", "cancelled")).toBe(true);
    expect(isValidOrderTransition("packed", "cancelled")).toBe(true);
  });

  it("blocks invalid skips", () => {
    expect(isValidOrderTransition("awaiting_payment", "shipped")).toBe(false);
    expect(isValidOrderTransition("awaiting_payment", "delivered")).toBe(false);
    expect(isValidOrderTransition("delivered", "packed")).toBe(false);
    expect(isValidOrderTransition("cancelled", "confirmed")).toBe(false);
  });

  it("lists next statuses for admin UI", () => {
    expect(allowedNextStatuses("awaiting_payment")).toEqual(["confirmed", "cancelled"]);
    expect(allowedNextStatuses("awaiting_stock_confirmation")).toEqual(["cancelled"]);
    expect(allowedNextStatuses("delivered")).toEqual([]);
  });

  it("supports backorder stock confirmation workflow", () => {
    expect(isValidOrderTransition("awaiting_stock_confirmation", "cancelled")).toBe(true);
    expect(isValidOrderTransition("awaiting_stock_confirmation", "awaiting_payment")).toBe(false);
  });
});

describe("ordersToCsv", () => {
  it("exports headers and escaped values", () => {
    const csv = ordersToCsv([
      {
        order_reference: "KS-2026-000001",
        customer_name: "Jane, Doe",
        phone: "0770486217",
        order_status: "confirmed",
        payment_status: "paid",
        grand_total: 125_000,
        total: 120_000,
        delivery_area: "Kololo",
        created_at: "2026-06-05T10:00:00.000Z",
      },
    ]);

    expect(csv).toContain("reference,customer,phone");
    expect(csv).toContain('"Jane, Doe"');
    expect(csv).toContain("KS-2026-000001");
    expect(csv).toContain("125000");
  });
});
