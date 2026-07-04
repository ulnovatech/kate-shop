import type { OrderStatus } from "./db/contracts";

export const ORDER_STATUS_COPY: Record<OrderStatus, string> = {
  awaiting_stock_confirmation: "Checking stock",
  awaiting_payment: "Waiting for payment",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function humanOrderStatus(status: string | null | undefined): string {
  if (!status) return "Unknown";
  return ORDER_STATUS_COPY[status as OrderStatus] ?? status.replace(/_/g, " ");
}

export function humanInventoryState(state: string | null | undefined): string {
  switch (state) {
    case "reserved":
      return "Stock reserved";
    case "released":
      return "Stock released";
    case "fulfilled":
      return "Stock fulfilled";
    case "pending":
      return "Waiting for stock check";
    default:
      return state ? state.replace(/_/g, " ") : "Not checked";
  }
}

/** The main forward workflow step (excludes cancel). */
export function primaryOrderTransition(statuses: OrderStatus[]): OrderStatus | null {
  return statuses.find((s) => s !== "cancelled") ?? null;
}

export function nextOrderActionLabel(status: OrderStatus): string {
  switch (status) {
    case "awaiting_stock_confirmation":
      return "Check stock";
    case "awaiting_payment":
      return "Wait for payment";
    case "confirmed":
      return "Prepare order";
    case "packed":
      return "Send for delivery";
    case "shipped":
      return "Mark delivered";
    case "delivered":
      return "Order complete";
    case "cancelled":
      return "Cancel order";
  }
}

/** Customer-facing stock availability on product pages. */
export function humanStockAvailability(available: number): {
  label: string;
  tone: "available" | "low" | "out";
} {
  if (available <= 0) {
    return { label: "Currently unavailable", tone: "out" };
  }
  if (available <= 3) {
    return { label: `Only ${available} left — order soon`, tone: "low" };
  }
  return { label: `In stock — ${available} available`, tone: "available" };
}

/** Customer-facing payment status labels. */
export const CUSTOMER_PAYMENT_STATUS_COPY: Record<string, string> = {
  pending: "Waiting for payment",
  partially_paid: "Partly paid",
  paid: "Paid in full",
  failed: "Payment issue",
  refunded: "Refunded",
};

export function humanPaymentStatus(status: string | null | undefined): string {
  if (!status) return "Unknown";
  return CUSTOMER_PAYMENT_STATUS_COPY[status] ?? status.replace(/_/g, " ");
}

/** What the customer should do next on the order confirmation page. */
export function customerOrderNextStep(
  orderStatus: string,
  paymentStatus: string,
  amountRemaining: number,
): string {
  if (orderStatus === "cancelled") {
    return "This order was cancelled. Contact us if you have questions.";
  }
  if (orderStatus === "delivered") {
    return "Your order has been delivered. Thank you for shopping with us!";
  }
  if (orderStatus === "shipped") {
    return "Your order is on the way. We'll call when it arrives.";
  }
  if (orderStatus === "awaiting_stock_confirmation") {
    return "We're checking stock. We'll contact you before asking for payment.";
  }
  if (paymentStatus === "paid") {
    return "Payment received — we're preparing your order for delivery.";
  }
  if (amountRemaining > 0) {
    return "Complete payment using the instructions below, then message us on WhatsApp with your confirmation.";
  }
  return "We'll contact you shortly with the next steps.";
}

export const ORDER_TRACKING_STEPS = [
  { key: "placed", label: "Order placed" },
  { key: "stock", label: "Stock check" },
  { key: "payment", label: "Payment" },
  { key: "preparing", label: "Preparing" },
  { key: "delivery", label: "On the way" },
  { key: "done", label: "Delivered" },
] as const;

export function orderTrackingStepIndex(orderStatus: string, paymentStatus: string): number {
  if (orderStatus === "cancelled") return -1;
  if (orderStatus === "delivered") return 5;
  if (orderStatus === "shipped") return 4;
  if (orderStatus === "packed" || orderStatus === "confirmed") return 3;
  if (paymentStatus === "paid" || orderStatus === "awaiting_payment") return 2;
  if (orderStatus === "awaiting_stock_confirmation") return 1;
  return 0;
}
