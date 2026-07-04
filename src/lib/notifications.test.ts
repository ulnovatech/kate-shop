import { describe, expect, it } from "vitest";
import { renderNotificationTemplate } from "@/lib/notifications";

describe("renderNotificationTemplate", () => {
  it("substitutes placeholders", () => {
    const msg = renderNotificationTemplate(
      "Hi {{customer_name}}, order {{order_reference}} total {{grand_total}} to {{delivery_area}}.",
      {
        customer_name: "Jane",
        order_reference: "KS-2026-000042",
        grand_total: "UGX 120,000",
        delivery_area: "Kololo",
      },
    );
    expect(msg).toBe("Hi Jane, order KS-2026-000042 total UGX 120,000 to Kololo.");
  });

  it("leaves unknown placeholders empty", () => {
    const msg = renderNotificationTemplate("{{unknown}}", {
      customer_name: "Jane",
      order_reference: "KS-2026-000001",
      grand_total: "UGX 1",
    });
    expect(msg).toBe("");
  });
});
