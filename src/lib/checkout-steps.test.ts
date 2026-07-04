import { describe, expect, it } from "vitest";
import {
  checkoutStep1Schema,
  checkoutStep2Schema,
  nextCheckoutWizardStep,
  prevCheckoutWizardStep,
} from "@/lib/checkout-steps";

describe("checkout-steps", () => {
  it("validates step 1 fields only", () => {
    const bad = checkoutStep1Schema.safeParse({
      customer_name: "A",
      phone: "invalid",
      email: "not-an-email",
    });
    expect(bad.success).toBe(false);

    const good = checkoutStep1Schema.safeParse({
      customer_name: "Jane Doe",
      phone: "0700123456",
      email: "",
    });
    expect(good.success).toBe(true);
  });

  it("validates step 2 fields only", () => {
    const bad = checkoutStep2Schema.safeParse({ area: "", address: "" });
    expect(bad.success).toBe(false);

    const good = checkoutStep2Schema.safeParse({
      area: "Nakawa",
      address: "Near mall",
    });
    expect(good.success).toBe(true);
  });

  it("advances and retreats wizard steps", () => {
    expect(nextCheckoutWizardStep(1)).toBe(2);
    expect(nextCheckoutWizardStep(2)).toBe(3);
    expect(nextCheckoutWizardStep(3)).toBe(4);
    expect(nextCheckoutWizardStep(4)).toBe(4);
    expect(prevCheckoutWizardStep(4)).toBe(3);
    expect(prevCheckoutWizardStep(1)).toBe(1);
  });
});
