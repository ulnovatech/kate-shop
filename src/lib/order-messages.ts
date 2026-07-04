import { formatKES } from "@/lib/shop";
import { FALLBACK_SHOP_NAME } from "@/lib/store-branding";
import { formatPhoneDisplay } from "@/lib/phone";

export type OrderMessageLine = {
  name: string;
  quantity: number;
  price: number;
};

export type OrderMessageInput = {
  orderReference: string;
  customerName: string;
  phone: string;
  deliveryArea: string | null;
  address?: string | null;
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  expressDelivery?: boolean;
  cashOnDelivery?: boolean;
  items: OrderMessageLine[];
};

export function buildWhatsAppOrderMessage(order: OrderMessageInput, shopName?: string): string {
  const store = shopName?.trim() || FALLBACK_SHOP_NAME;
  const lines = [
    `Hello ${store}, I've placed order *${order.orderReference}*`,
    "",
    `Name: ${order.customerName}`,
    `Phone: ${formatPhoneDisplay(order.phone)}`,
  ];

  if (order.deliveryArea) {
    lines.push(`Delivery area: ${order.deliveryArea}`);
  }
  if (order.address?.trim()) {
    lines.push(`Address: ${order.address.trim()}`);
  }

  lines.push("", "*Items:*");
  for (const item of order.items) {
    lines.push(`• ${item.name} × ${item.quantity} — ${formatKES(item.price * item.quantity)}`);
  }

  lines.push(
    "",
    `Subtotal: ${formatKES(order.subtotal)}`,
    `Delivery: ${formatKES(order.deliveryFee)}`,
    `*Total: ${formatKES(order.grandTotal)}*`,
  );

  if (order.expressDelivery) lines.push("Express delivery requested");
  if (order.cashOnDelivery) lines.push("Cash on delivery");

  lines.push("", "Please confirm payment and delivery. Thank you!");

  return lines.join("\n");
}
