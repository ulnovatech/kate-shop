import { describe, expect, it } from "vitest";
import {
  evaluateSetupChecks,
  setupCompletionPercent,
  SETUP_CHECK_DEFINITIONS,
} from "./admin-setup-completion";

describe("admin-setup-completion", () => {
  it("marks all checks complete when requirements met", () => {
    const checks = evaluateSetupChecks({
      shopName: "Kate Boutique",
      phone: "0700123456",
      whatsapp: "",
      deliveryZoneCount: 2,
      enabledPaymentMethodCount: 1,
      productCount: 3,
    });
    expect(checks.every((c) => c.complete)).toBe(true);
    expect(setupCompletionPercent(checks)).toBe(100);
  });

  it("requires real shop name not fallback", () => {
    const checks = evaluateSetupChecks({
      shopName: "Store",
      phone: "0700123456",
      whatsapp: "",
      deliveryZoneCount: 1,
      enabledPaymentMethodCount: 1,
      productCount: 1,
    });
    expect(checks.find((c) => c.id === "store")?.complete).toBe(false);
  });

  it("returns four setup steps", () => {
    expect(SETUP_CHECK_DEFINITIONS).toHaveLength(4);
  });

  it("calculates partial percent", () => {
    const checks = evaluateSetupChecks({
      shopName: "Kate",
      phone: "0700123456",
      whatsapp: "",
      deliveryZoneCount: 0,
      enabledPaymentMethodCount: 0,
      productCount: 0,
    });
    expect(setupCompletionPercent(checks)).toBe(25);
  });
});
