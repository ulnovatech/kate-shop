import type { ProductListFilter } from "@/lib/catalog";
import type { AdminProductListFilters } from "@/lib/list-filters";
import { DEFAULT_LIST_PAGE_SIZE, paginationRange } from "@kate/api/list-pagination";

/** Minimal chainable query shape for Supabase PostgREST builders. */
/** Default low-stock ceiling when filtering (matches common product threshold). */
export const ADMIN_PRODUCT_LOW_STOCK_CEILING = 5;

export type ProductListQuery<T> = {
  is(column: string, value: null): T;
  not(column: string, operator: string, value: null): T;
  eq(column: string, value: string | boolean): T;
  in(column: string, values: string[]): T;
  gt(column: string, value: number): T;
  gte(column: string, value: number): T;
  lte(column: string, value: number): T;
  or(filters: string): T;
  order(
    column: string,
    options: { ascending: boolean },
  ): T;
  range(from: number, to: number): T;
};

export type AdminProductListQueryOptions = {
  filters: AdminProductListFilters;
  pageSize?: number;
  paginate?: boolean;
  /** Category ids to match (category + descendants). Overrides single `categoryId` eq. */
  categoryScopeIds?: string[] | null;
};

export function applyAdminProductListFilters<T extends ProductListQuery<T>>(
  qb: T,
  filters: Pick<
    AdminProductListFilters,
    "q" | "categoryId" | "listFilter" | "priceMin" | "priceMax" | "stockFilter" | "featured"
  >,
  options?: Pick<AdminProductListQueryOptions, "categoryScopeIds">,
): T {
  let query = qb.is("deleted_at", null);

  if (filters.listFilter === "active") {
    query = query.is("archived_at", null);
  } else if (filters.listFilter === "archived") {
    query = query.not("archived_at", "is", null);
  }

  const scopeIds = options?.categoryScopeIds;
  if (scopeIds?.length) {
    query =
      scopeIds.length === 1
        ? query.eq("category_id", scopeIds[0])
        : query.in("category_id", scopeIds);
  } else if (filters.categoryId !== "all") {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.featured === "yes") {
    query = query.eq("is_featured", true);
  } else if (filters.featured === "no") {
    query = query.eq("is_featured", false);
  }

  if (filters.stockFilter === "in_stock") {
    query = query.gt("available_stock", 0);
  } else if (filters.stockFilter === "out_of_stock") {
    query = query.lte("available_stock", 0);
  } else if (filters.stockFilter === "low_stock") {
    query = query
      .gt("available_stock", 0)
      .lte("available_stock", ADMIN_PRODUCT_LOW_STOCK_CEILING);
  }

  const minPrice = Number.parseInt((filters.priceMin ?? "").trim(), 10);
  if (!Number.isNaN(minPrice) && minPrice > 0) {
    query = query.gte("price", minPrice);
  }
  const maxPrice = Number.parseInt((filters.priceMax ?? "").trim(), 10);
  if (!Number.isNaN(maxPrice) && maxPrice > 0) {
    query = query.lte("price", maxPrice);
  }

  const term = filters.q.trim();
  if (term) {
    const pattern = `%${term}%`;
    query = query.or(`name.ilike.${pattern},sku.ilike.${pattern}`);
  }

  return query.order("updated_at", { ascending: false });
}

export function applyAdminProductListPagination<T extends ProductListQuery<T>>(
  qb: T,
  options: AdminProductListQueryOptions,
): T {
  if (!options.paginate) return qb;
  const { from, to } = paginationRange(options.filters.page, options.pageSize ?? DEFAULT_LIST_PAGE_SIZE);
  return qb.range(from, to);
}

export function buildAdminProductListQuery<T extends ProductListQuery<T>>(
  qb: T,
  options: AdminProductListQueryOptions,
): T {
  const filtered = applyAdminProductListFilters(qb, options.filters, {
    categoryScopeIds: options.categoryScopeIds,
  });
  return applyAdminProductListPagination(filtered, options);
}

export const ADMIN_PRODUCT_LIST_FILTER_LABELS: Record<ProductListFilter, string> = {
  active: "Active",
  archived: "Archived",
  all: "All",
};

export const ADMIN_PRODUCT_STOCK_FILTER_LABELS: Record<
  AdminProductListFilters["stockFilter"],
  string
> = {
  all: "All stock",
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

export const ADMIN_PRODUCT_FEATURED_FILTER_LABELS: Record<
  AdminProductListFilters["featured"],
  string
> = {
  all: "All products",
  yes: "Featured only",
  no: "Not featured",
};
