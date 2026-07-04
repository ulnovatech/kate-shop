import type { OrderStatus } from "@/lib/db/contracts";

/** Admin order detail pipeline: stock → payment → status → delivery. */
export const ADMIN_ORDER_PIPELINE_STEPS = [
  { id: "stock", label: "Stock" },
  { id: "payment", label: "Payment" },
  { id: "status", label: "Status" },
  { id: "delivery", label: "Delivery" },
] as const;

/**
 * Active step index (0–3). Returns -1 when cancelled, 4 when fully delivered.
 */
export function adminOrderPipelineStepIndex(
  orderStatus: OrderStatus | string,
  paymentStatus: string,
): number {
  if (orderStatus === "cancelled") return -1;
  if (orderStatus === "delivered") return 4;
  if (orderStatus === "shipped") return 3;
  if (orderStatus === "packed" || orderStatus === "confirmed") return 2;
  if (orderStatus === "awaiting_payment") {
    return paymentStatus === "paid" || paymentStatus === "partially_paid" ? 2 : 1;
  }
  if (orderStatus === "awaiting_stock_confirmation") return 0;
  return 0;
}
