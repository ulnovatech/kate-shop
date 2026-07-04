import { describe, expect, it } from "vitest";
import { previewNotificationTemplate } from "@/lib/notification-template-preview";

describe("notification template preview", () => {
  it("renders placeholders with sample order data", () => {
    const preview = previewNotificationTemplate(
      "order_placed",
      "Hi {{customer_name}}, order {{order_reference}} for {{grand_total}}.",
    );
    expect(preview).toContain("Jane Nakato");
    expect(preview).toContain("KS-2406-001");
    expect(preview).toContain("UGX 185,000");
  });

  it("falls back to default template when empty", () => {
    const preview = previewNotificationTemplate("payment_confirmed", "");
    expect(preview).toContain("Jane Nakato");
    expect(preview.toLowerCase()).toContain("payment");
  });
});
