import { z } from "zod";
import type { ProductListFilter } from "@/lib/catalog";
import { ORDER_STATUSES } from "@/lib/db/contracts";

/** Remove empty strings and undefined from search param objects. */
export function cleanSearchParams<T extends Record<string, unknown>>(params: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    out[key] = value;
  }
  return out as Partial<T>;
}

export function countActiveFilters<T extends Record<string, unknown>>(
  current: T,
  defaults: T,
): number {
  let count = 0;
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    if (current[key] !== defaults[key]) count += 1;
  }
  return count;
}

export function buildListQueryKey(prefix: string, filters: Record<string, unknown>): unknown[] {
  const stable = Object.keys(filters)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = filters[key];
      return acc;
    }, {});
  return [prefix, stable];
}

// ── Admin product list ─────────────────────────────────────────────────────

export const adminProductListSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["active", "archived", "all"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  stock: z.enum(["all", "in_stock", "low_stock", "out_of_stock"]).optional(),
  featured: z.enum(["all", "yes", "no"]).optional(),
});

export type AdminProductListSearch = z.infer<typeof adminProductListSearchSchema>;

export type AdminProductListFilters = {
  q: string;
  categoryId: string;
  listFilter: ProductListFilter;
  page: number;
  priceMin: string;
  priceMax: string;
  stockFilter: "all" | "in_stock" | "low_stock" | "out_of_stock";
  featured: "all" | "yes" | "no";
};

export const ADMIN_PRODUCT_LIST_DEFAULTS: AdminProductListFilters = {
  q: "",
  categoryId: "all",
  listFilter: "active",
  page: 1,
  priceMin: "",
  priceMax: "",
  stockFilter: "all",
  featured: "all",
};

export function parseAdminProductListFilters(
  search: AdminProductListSearch,
): AdminProductListFilters {
  return {
    q: search.q?.trim() ?? "",
    categoryId: search.category?.trim() || "all",
    listFilter: search.status ?? "active",
    page: search.page ?? 1,
    priceMin: search.priceMin != null ? String(search.priceMin) : "",
    priceMax: search.priceMax != null ? String(search.priceMax) : "",
    stockFilter: search.stock ?? "all",
    featured: search.featured ?? "all",
  };
}

export function serializeAdminProductListFilters(
  filters: AdminProductListFilters,
): AdminProductListSearch {
  const priceMin = filters.priceMin.trim() ? Number(filters.priceMin) : undefined;
  const priceMax = filters.priceMax.trim() ? Number(filters.priceMax) : undefined;
  return cleanSearchParams({
    q: filters.q || undefined,
    category: filters.categoryId === "all" ? undefined : filters.categoryId,
    status: filters.listFilter === "active" ? undefined : filters.listFilter,
    page: filters.page > 1 ? filters.page : undefined,
    priceMin: priceMin && !Number.isNaN(priceMin) ? priceMin : undefined,
    priceMax: priceMax && !Number.isNaN(priceMax) ? priceMax : undefined,
    stock: filters.stockFilter === "all" ? undefined : filters.stockFilter,
    featured: filters.featured === "all" ? undefined : filters.featured,
  });
}

// ── Admin order list ───────────────────────────────────────────────────────

const orderStatusSearchValues = ["all", ...ORDER_STATUSES] as const;

export const adminOrderListSearchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(orderStatusSearchValues).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export type AdminOrderListSearch = z.infer<typeof adminOrderListSearchSchema>;

export type AdminOrderListFilters = {
  q: string;
  status: (typeof orderStatusSearchValues)[number];
  dateFrom: string;
  dateTo: string;
  page: number;
};

export const ADMIN_ORDER_LIST_DEFAULTS: AdminOrderListFilters = {
  q: "",
  status: "all",
  dateFrom: "",
  dateTo: "",
  page: 1,
};

export function parseAdminOrderListFilters(search: AdminOrderListSearch): AdminOrderListFilters {
  return {
    q: search.q?.trim() ?? "",
    status: search.status ?? "all",
    dateFrom: search.from?.trim() ?? "",
    dateTo: search.to?.trim() ?? "",
    page: search.page ?? 1,
  };
}

export function serializeAdminOrderListFilters(
  filters: AdminOrderListFilters,
): AdminOrderListSearch {
  return cleanSearchParams({
    q: filters.q || undefined,
    status: filters.status === "all" ? undefined : filters.status,
    from: filters.dateFrom || undefined,
    to: filters.dateTo || undefined,
    page: filters.page > 1 ? filters.page : undefined,
  });
}

export function adminOrderFiltersToApi(filters: AdminOrderListFilters) {
  return {
    query: filters.q || undefined,
    status: filters.status === "all" ? undefined : filters.status,
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    page: filters.page,
  };
}

// ── Admin payments (unpaid orders) ─────────────────────────────────────────

export const adminPaymentsListSearchSchema = z.object({
  q: z.string().optional(),
});

export type AdminPaymentsListSearch = z.infer<typeof adminPaymentsListSearchSchema>;

export type AdminPaymentsListFilters = {
  q: string;
};

export const ADMIN_PAYMENTS_LIST_DEFAULTS: AdminPaymentsListFilters = {
  q: "",
};

export function parseAdminPaymentsListFilters(
  search: AdminPaymentsListSearch,
): AdminPaymentsListFilters {
  return { q: search.q?.trim() ?? "" };
}

export function serializeAdminPaymentsListFilters(
  filters: AdminPaymentsListFilters,
): AdminPaymentsListSearch {
  return cleanSearchParams({ q: filters.q || undefined });
}

// ── Admin notifications ────────────────────────────────────────────────────

export const NOTIFICATION_LIST_STATUSES = [
  "pending",
  "sent",
  "failed",
  "skipped",
  "all",
] as const;

export type NotificationListStatus = (typeof NOTIFICATION_LIST_STATUSES)[number];

export const adminNotificationListSearchSchema = z.object({
  status: z.enum(NOTIFICATION_LIST_STATUSES).optional(),
});

export type AdminNotificationListSearch = z.infer<typeof adminNotificationListSearchSchema>;

export type AdminNotificationListFilters = {
  status: NotificationListStatus;
};

export const ADMIN_NOTIFICATION_LIST_DEFAULTS: AdminNotificationListFilters = {
  status: "pending",
};

export function parseAdminNotificationListFilters(
  search: AdminNotificationListSearch,
): AdminNotificationListFilters {
  return { status: search.status ?? "pending" };
}

export function serializeAdminNotificationListFilters(
  filters: AdminNotificationListFilters,
): AdminNotificationListSearch {
  return cleanSearchParams({
    status: filters.status === "pending" ? undefined : filters.status,
  });
}

// ── Admin audit ────────────────────────────────────────────────────────────

export const AUDIT_ENTITY_TYPES = [
  "all",
  "product",
  "category",
  "order",
  "payment",
  "inventory",
  "settings",
  "invite",
  "user",
] as const;

export type AuditEntityFilter = (typeof AUDIT_ENTITY_TYPES)[number];

export const adminAuditListSearchSchema = z.object({
  q: z.string().optional(),
  action: z.string().optional(),
  entity: z.enum(AUDIT_ENTITY_TYPES).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type AdminAuditListSearch = z.infer<typeof adminAuditListSearchSchema>;

export type AdminAuditListFilters = {
  q: string;
  action: string;
  entityType: AuditEntityFilter;
  dateFrom: string;
  dateTo: string;
};

export const ADMIN_AUDIT_LIST_DEFAULTS: AdminAuditListFilters = {
  q: "",
  action: "all",
  entityType: "all",
  dateFrom: "",
  dateTo: "",
};

export function parseAdminAuditListFilters(search: AdminAuditListSearch): AdminAuditListFilters {
  return {
    q: search.q?.trim() ?? "",
    action: search.action?.trim() || "all",
    entityType: search.entity ?? "all",
    dateFrom: search.from?.trim() ?? "",
    dateTo: search.to?.trim() ?? "",
  };
}

export function serializeAdminAuditListFilters(
  filters: AdminAuditListFilters,
): AdminAuditListSearch {
  return cleanSearchParams({
    q: filters.q || undefined,
    action: filters.action === "all" ? undefined : filters.action,
    entity: filters.entityType === "all" ? undefined : filters.entityType,
    from: filters.dateFrom || undefined,
    to: filters.dateTo || undefined,
  });
}
