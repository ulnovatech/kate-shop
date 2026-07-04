/**
 * Chunk 3+ — shared DB contracts (enums / statuses).
 */

export const STAFF_ROLES = ["owner", "manager", "staff", "admin"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ORDER_STATUSES = [
  "awaiting_stock_confirmation",
  "awaiting_payment",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const INVENTORY_MODES = ["strict", "backorder"] as const;
export type InventoryMode = (typeof INVENTORY_MODES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "partially_paid",
  "paid",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = [
  "mtn_momo",
  "airtel_money",
  "cash_on_delivery",
  "bank_transfer",
] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export type DeliveryZoneRow = {
  id: string;
  zone_number: number;
  name: string;
  fee: number;
  description: string | null;
  estimated_days: string | null;
  free_delivery_threshold: number | null;
  is_active: boolean;
  sort_order: number;
};

export type DeliveryRulesRow = {
  id: number;
  express_delivery_fee: number;
  cod_fee: number;
  free_delivery_zones_1_2_threshold: number;
  free_delivery_all_zones_threshold: number;
  currency: string;
};
