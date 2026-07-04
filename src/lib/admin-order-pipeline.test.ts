import { describe, expect, it } from "vitest";
import { adminOrderPipelineStepIndex } from "./admin-order-pipeline";

describe("adminOrderPipelineStepIndex", () => {
  it("maps stock confirmation to step 0", () => {
    expect(adminOrderPipelineStepIndex("awaiting_stock_confirmation", "pending")).toBe(0);
  });

  it("maps unpaid awaiting payment to payment step", () => {
    expect(adminOrderPipelineStepIndex("awaiting_payment", "pending")).toBe(1);
  });

  it("maps partial payment to status step", () => {
    expect(adminOrderPipelineStepIndex("awaiting_payment", "partially_paid")).toBe(2);
  });

  it("maps confirmed and packed to status step", () => {
    expect(adminOrderPipelineStepIndex("confirmed", "paid")).toBe(2);
    expect(adminOrderPipelineStepIndex("packed", "paid")).toBe(2);
  });

  it("maps shipped to delivery step", () => {
    expect(adminOrderPipelineStepIndex("shipped", "paid")).toBe(3);
  });

  it("returns 4 when delivered", () => {
    expect(adminOrderPipelineStepIndex("delivered", "paid")).toBe(4);
  });

  it("returns -1 when cancelled", () => {
    expect(adminOrderPipelineStepIndex("cancelled", "pending")).toBe(-1);
  });
});
