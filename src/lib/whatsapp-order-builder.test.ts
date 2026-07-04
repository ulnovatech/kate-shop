import { describe, expect, it } from "vitest";
import {
  buildWhatsAppInquiryMessage,
  cartItemsToInquiry,
  inquirySubtotal,
} from "@/lib/whatsapp-order-builder";

describe("whatsapp order builder", () => {
  const items = [
    { name: "Gold Ring", quantity: 1, price: 120000, sku: "GR-01" },
    { name: "Pearl Earrings", quantity: 2, price: 45000 },
  ];

  it("sums inquiry subtotal", () => {
    expect(inquirySubtotal(items)).toBe(210000);
  });

  it("builds inquiry message with items and customer details", () => {
    const message = buildWhatsAppInquiryMessage(
      {
        customerName: "Jane Nakato",
        phone: "0700123456",
        deliveryArea: "Ntinda",
        items,
        notes: "Gift wrap please",
      },
      "Kate Shop",
    );

    expect(message).toContain("Hello Kate Shop");
    expect(message).toContain("Jane Nakato");
    expect(message).toContain("Gold Ring");
    expect(message).toContain("GR-01");
    expect(message).toContain("Pearl Earrings × 2");
    expect(message).toContain("Gift wrap please");
    expect(message).toContain("Delivery: to be confirmed");
  });

  it("maps cart lines to inquiry items", () => {
    const mapped = cartItemsToInquiry([{ name: "Bangle", quantity: 3, price: 10000 }]);
    expect(mapped).toEqual([{ name: "Bangle", quantity: 3, price: 10000 }]);
  });
});
