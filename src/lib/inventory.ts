import type { OrderStatus } from "@/lib/db/contracts";
import { humanOrderStatus } from "@/lib/human-labels";

/** Statuses that release reserved stock back to available. */
export const INVENTORY_RELEASE_STATUSES: OrderStatus[] = ["cancelled"];

/** Statuses that consume reserved stock (sale complete). */
export const INVENTORY_FULFILL_STATUSES: OrderStatus[] = ["delivered"];

export type StockSnapshot = {
  available_stock: number;
  reserved_stock?: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
};

export function isInStock(snapshot: StockSnapshot): boolean {
  return (snapshot.available_stock ?? 0) > 0;
}

export function maxPurchasable(snapshot: StockSnapshot): number {
  return Math.max(0, snapshot.available_stock ?? 0);
}

export function shouldReleaseInventory(to: OrderStatus): boolean {
  return INVENTORY_RELEASE_STATUSES.includes(to);
}

export function shouldFulfillInventory(to: OrderStatus): boolean {
  return INVENTORY_FULFILL_STATUSES.includes(to);
}

/** Admin-selectable order statuses (Chunk 12 expands transitions). */
export const ADMIN_ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "awaiting_stock_confirmation", label: "Checking stock" },
  { value: "awaiting_payment", label: "Waiting for payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "On the way" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function formatOrderStatus(status: string | null | undefined): string {
  return humanOrderStatus(status);
}
