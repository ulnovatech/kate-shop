import { z } from "zod";
import type { ShopSort } from "@/lib/shop-sort";

export const shopSearchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "name_asc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  inStock: z.literal("1").optional(),
  featured: z.literal("1").optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
});

export type ShopSearch = z.infer<typeof shopSearchSchema>;

export type ShopListFilters = {
  category?: string;
  q?: string;
  sort: ShopSort;
  page: number;
  inStockOnly: boolean;
  featuredOnly: boolean;
  minPrice: string;
  maxPrice: string;
};

export const SHOP_LIST_DEFAULTS: ShopListFilters = {
  sort: "newest",
  page: 1,
  inStockOnly: false,
  featuredOnly: false,
  minPrice: "",
  maxPrice: "",
};

export const SHOP_PAGE_SIZE = 24;

export function parseShopListFilters(search: ShopSearch): ShopListFilters {
  return {
    category: search.category,
    q: search.q?.trim() || undefined,
    sort: search.sort ?? "newest",
    page: search.page ?? 1,
    inStockOnly: search.inStock === "1",
    featuredOnly: search.featured === "1",
    minPrice: search.minPrice != null ? String(search.minPrice) : "",
    maxPrice: search.maxPrice != null ? String(search.maxPrice) : "",
  };
}

export function serializeShopListFilters(filters: ShopListFilters): ShopSearch {
  const minPrice = filters.minPrice.trim() ? Number(filters.minPrice) : undefined;
  const maxPrice = filters.maxPrice.trim() ? Number(filters.maxPrice) : undefined;
  return {
    category: filters.category,
    q: filters.q || undefined,
    sort: filters.sort === "newest" ? undefined : filters.sort,
    page: filters.page > 1 ? filters.page : undefined,
    inStock: filters.inStockOnly ? "1" : undefined,
    featured: filters.featuredOnly ? "1" : undefined,
    minPrice: minPrice && !Number.isNaN(minPrice) ? minPrice : undefined,
    maxPrice: maxPrice && !Number.isNaN(maxPrice) ? maxPrice : undefined,
  };
}
