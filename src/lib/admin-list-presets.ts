import type { AdminOrderListFilters, AdminProductListFilters } from "@/lib/list-filters";
import { ADMIN_ORDER_LIST_DEFAULTS, ADMIN_PRODUCT_LIST_DEFAULTS } from "@/lib/list-filters";

export const PRODUCT_LIST_PRESETS: { name: string; filters: AdminProductListFilters }[] = [
  {
    name: "Low stock",
    filters: {
      ...ADMIN_PRODUCT_LIST_DEFAULTS,
      stockFilter: "low_stock",
    },
  },
  {
    name: "Featured",
    filters: {
      ...ADMIN_PRODUCT_LIST_DEFAULTS,
      featured: "yes",
    },
  },
  {
    name: "Archived",
    filters: {
      ...ADMIN_PRODUCT_LIST_DEFAULTS,
      listFilter: "archived",
    },
  },
];

export const ORDER_LIST_PRESETS: { name: string; filters: AdminOrderListFilters }[] = [
  {
    name: "Awaiting payment",
    filters: {
      ...ADMIN_ORDER_LIST_DEFAULTS,
      status: "awaiting_payment",
    },
  },
  {
    name: "Confirmed",
    filters: {
      ...ADMIN_ORDER_LIST_DEFAULTS,
      status: "confirmed",
    },
  },
];
