import { describe, expect, it } from "vitest";
import { ordersOtpStepFromVerifyStep } from "@/components/storefront/orders-otp-stepper";

describe("ordersOtpStepFromVerifyStep", () => {
  it("maps idle to phone step", () => {
    expect(ordersOtpStepFromVerifyStep("idle")).toBe(1);
  });

  it("maps otp-sent to code step", () => {
    expect(ordersOtpStepFromVerifyStep("otp-sent")).toBe(2);
  });
});
