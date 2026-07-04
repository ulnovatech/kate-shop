import { describe, expect, it } from "vitest";
import { setupCompletionPercent, evaluateSetupChecks } from "@/lib/admin-setup-completion";

describe("GoLiveChecklist data", () => {
  it("computes percent from setup checks", () => {
    const checks = evaluateSetupChecks({
      shopName: "Kate Boutique",
      phone: "0700123456",
      whatsapp: "",
      deliveryZoneCount: 1,
      enabledPaymentMethodCount: 0,
      productCount: 0,
    });
    expect(setupCompletionPercent(checks)).toBe(50);
  });
});
