import { formatKES } from "@/lib/shop";
import { FALLBACK_SHOP_NAME } from "@/lib/store-branding";
import { formatPhoneDisplay } from "@/lib/phone";

export type WhatsAppInquiryItem = {
  name: string;
  quantity: number;
  price: number;
  sku?: string | null;
};

export type WhatsAppInquiryInput = {
  customerName: string;
  phone: string;
  deliveryArea?: string;
  address?: string;
  notes?: string;
  items: WhatsAppInquiryItem[];
};

export function inquirySubtotal(items: WhatsAppInquiryItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/** X-05 — customer WhatsApp inquiry before or instead of web checkout. */
export function buildWhatsAppInquiryMessage(
  input: WhatsAppInquiryInput,
  shopName?: string,
): string {
  const store = shopName?.trim() || FALLBACK_SHOP_NAME;
  const subtotal = inquirySubtotal(input.items);

  const lines = [
    `Hello ${store}, I'd like to place an order:`,
    "",
    `Name: ${input.customerName}`,
    `Phone: ${formatPhoneDisplay(input.phone)}`,
  ];

  if (input.deliveryArea?.trim()) {
    lines.push(`Delivery area: ${input.deliveryArea.trim()}`);
  }
  if (input.address?.trim()) {
    lines.push(`Address: ${input.address.trim()}`);
  }

  lines.push("", "*Items:*");
  for (const item of input.items) {
    const sku = item.sku?.trim();
    const skuPart = sku ? ` (${sku})` : "";
    lines.push(
      `• ${item.name}${skuPart} × ${item.quantity} — ${formatKES(item.price * item.quantity)}`,
    );
  }

  lines.push(
    "",
    `Subtotal: ${formatKES(subtotal)}`,
    "Delivery: to be confirmed",
    `*Estimated total: ${formatKES(subtotal)}*`,
  );

  if (input.notes?.trim()) {
    lines.push("", `Notes: ${input.notes.trim()}`);
  }

  lines.push("", "Please confirm availability, delivery fee, and payment. Thank you!");

  return lines.join("\n");
}

export function cartItemsToInquiry(
  items: { name: string; quantity: number; price: number }[],
): WhatsAppInquiryItem[] {
  return items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  }));
}
