import { describe, expect, it } from "vitest";
import { amountRemaining, buildPaymentInstructions, sumPayments } from "@/lib/payments";

describe("sumPayments", () => {
  it("sums successful payments and ignores failed/refunded", () => {
    const total = sumPayments([
      { amount_paid: 50_000, payment_status: "paid" },
      { amount_paid: 25_000, payment_status: "partially_paid" },
      { amount_paid: 10_000, payment_status: "failed" },
      { amount_paid: 5_000, payment_status: "refunded" },
    ]);
    expect(total).toBe(75_000);
  });
});

describe("amountRemaining", () => {
  it("never goes negative", () => {
    expect(amountRemaining(100_000, 40_000)).toBe(60_000);
    expect(amountRemaining(100_000, 120_000)).toBe(0);
  });
});

describe("buildPaymentInstructions", () => {
  it("includes MoMo and reference when configured", () => {
    const instructions = buildPaymentInstructions(
      {
        mtn_momo_merchant_code: "123456",
        mtn_momo_merchant_name: "Kate Shop",
      },
      {
        orderReference: "KS-2026-000099",
        grandTotal: 80_000,
        amountRemaining: 80_000,
      },
    );

    expect(instructions).toHaveLength(1);
    expect(instructions[0].provider).toBe("mtn_momo");
    expect(instructions[0].lines.join(" ")).toContain("KS-2026-000099");
    expect(instructions[0].lines.join(" ")).toContain("123456");
  });

  it("adds COD block when requested", () => {
    const instructions = buildPaymentInstructions(
      {},
      {
        orderReference: "KS-2026-000100",
        grandTotal: 50_000,
        amountRemaining: 50_000,
        cashOnDelivery: true,
      },
    );
    expect(instructions.some((i) => i.provider === "cash_on_delivery")).toBe(true);
  });

  it("filters to preferred provider only", () => {
    const instructions = buildPaymentInstructions(
      {
        mtn_momo_merchant_code: "123456",
        airtel_merchant_code: "999",
      },
      {
        orderReference: "KS-2026-000101",
        grandTotal: 50_000,
        amountRemaining: 50_000,
        preferredProvider: "airtel_money",
      },
    );
    expect(instructions).toHaveLength(1);
    expect(instructions[0].provider).toBe("airtel_money");
  });

  it("respects enabledProviders list", () => {
    const instructions = buildPaymentInstructions(
      {
        mtn_momo_merchant_code: "123456",
        bank_transfer_instructions: "Bank ABC",
      },
      {
        orderReference: "KS-2026-000102",
        grandTotal: 50_000,
        amountRemaining: 50_000,
        enabledProviders: ["bank_transfer"],
      },
    );
    expect(instructions).toHaveLength(1);
    expect(instructions[0].provider).toBe("bank_transfer");
  });
});
