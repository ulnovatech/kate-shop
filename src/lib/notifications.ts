import { formatKES } from "@/lib/shop";
import { formatPhoneDisplay } from "@/lib/phone";

export const NOTIFICATION_EVENTS = ["order_placed", "payment_confirmed", "order_shipped"] as const;

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export const NOTIFICATION_EVENT_LABELS: Record<NotificationEvent, string> = {
  order_placed: "Order placed",
  payment_confirmed: "Payment confirmed",
  order_shipped: "Order shipped",
};

export const NOTIFICATION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  sent: "Sent",
  failed: "Failed",
  skipped: "Skipped",
};

/** Placeholders available in admin templates. */
export const TEMPLATE_PLACEHOLDERS = [
  "{{customer_name}}",
  "{{order_reference}}",
  "{{grand_total}}",
  "{{payment_amount}}",
  "{{delivery_area}}",
  "{{phone}}",
] as const;

export type TemplateVars = {
  customer_name: string;
  order_reference: string;
  grand_total: string;
  payment_amount?: string;
  delivery_area?: string;
  phone?: string;
};

export function renderNotificationTemplate(template: string, vars: TemplateVars): string {
  const map: Record<string, string> = {
    customer_name: vars.customer_name,
    order_reference: vars.order_reference,
    grand_total: vars.grand_total,
    payment_amount: vars.payment_amount ?? "",
    delivery_area: vars.delivery_area ?? "",
    phone: vars.phone ?? "",
  };

  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => map[key] ?? "");
}

export function defaultTemplate(event: NotificationEvent): string {
  switch (event) {
    case "order_placed":
      return "Hi {{customer_name}}, we received your order {{order_reference}} for {{grand_total}}.";
    case "payment_confirmed":
      return "Hi {{customer_name}}, payment received for order {{order_reference}} ({{payment_amount}}).";
    case "order_shipped":
      return "Hi {{customer_name}}, your order {{order_reference}} has shipped to {{delivery_area}}.";
  }
}

export function templateVarsFromOrder(order: {
  customer_name: string;
  phone: string;
  order_reference: string | null;
  grand_total: number | null;
  total: number;
  delivery_area: string | null;
  payment_amount?: number;
}): TemplateVars {
  const total = order.grand_total ?? order.total;
  return {
    customer_name: order.customer_name,
    order_reference: order.order_reference ?? "—",
    grand_total: formatKES(total),
    payment_amount: order.payment_amount != null ? formatKES(order.payment_amount) : undefined,
    delivery_area: order.delivery_area ?? "",
    phone: formatPhoneDisplay(order.phone),
  };
}
