import type { OrderStatus } from "@/lib/db/contracts";
import { formatOrderStatus } from "@/lib/inventory";

/** Kate shop order references: KS-YYYY-NNNNNN (from `generate_order_reference()`). */
export const ORDER_REFERENCE_PATTERN = /^KS-\d{4}-\d{6}$/;

export function isValidOrderReference(ref: string): boolean {
  return ORDER_REFERENCE_PATTERN.test(ref);
}

/** Valid forward transitions for the order workflow. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  awaiting_stock_confirmation: ["cancelled"],
  awaiting_payment: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function allowedNextStatuses(current: OrderStatus | null | undefined): OrderStatus[] {
  if (!current) return ["awaiting_stock_confirmation", "awaiting_payment", "cancelled"];
  return ORDER_TRANSITIONS[current] ?? [];
}

export function isValidOrderTransition(
  from: OrderStatus | null | undefined,
  to: OrderStatus,
): boolean {
  if (!from) return true;
  if (from === to) return true;
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export type OrderCsvRow = {
  order_reference: string | null;
  customer_name: string;
  phone: string;
  order_status: string | null;
  payment_status: string;
  grand_total: number | null;
  total: number;
  delivery_area: string | null;
  created_at: string;
};

export function ordersToCsv(rows: OrderCsvRow[]): string {
  const headers = [
    "reference",
    "customer",
    "phone",
    "order_status",
    "payment_status",
    "total_ugx",
    "delivery_area",
    "created_at",
  ];

  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const lines = rows.map((r) => {
    const total = r.grand_total ?? r.total;
    return [
      r.order_reference ?? "",
      r.customer_name,
      r.phone,
      formatOrderStatus(r.order_status),
      r.payment_status,
      String(total),
      r.delivery_area ?? "",
      new Date(r.created_at).toISOString(),
    ]
      .map(escape)
      .join(",");
  });

  return [headers.join(","), ...lines].join("\r\n");
}
