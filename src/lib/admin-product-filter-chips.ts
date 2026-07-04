import type { FilterChip } from "@/components/admin/admin-filter-chips";
import {
  ADMIN_PRODUCT_FEATURED_FILTER_LABELS,
  ADMIN_PRODUCT_LIST_FILTER_LABELS,
  ADMIN_PRODUCT_STOCK_FILTER_LABELS,
} from "@/lib/admin-product-list-query";
import type { AdminProductListFilters } from "@/lib/list-filters";
import { ADMIN_PRODUCT_LIST_DEFAULTS } from "@/lib/list-filters";
import type { CategoryRecord } from "@/lib/categories";

type ProductFilterChipHandlers = {
  onClearQuery: () => void;
  onClearCategory: () => void;
  onClearStatus: () => void;
  onClearStock: () => void;
  onClearFeatured: () => void;
  onClearPriceMin: () => void;
  onClearPriceMax: () => void;
};

export function buildProductFilterChips(
  applied: AdminProductListFilters,
  categories: CategoryRecord[],
  handlers: ProductFilterChipHandlers,
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (applied.q.trim()) {
    chips.push({ id: "q", label: `Search: ${applied.q.trim()}`, onRemove: handlers.onClearQuery });
  }
  if (applied.categoryId !== "all") {
    const name = categories.find((c) => c.id === applied.categoryId)?.name ?? "Category";
    chips.push({ id: "category", label: name, onRemove: handlers.onClearCategory });
  }
  if (applied.listFilter !== ADMIN_PRODUCT_LIST_DEFAULTS.listFilter) {
    chips.push({
      id: "status",
      label: ADMIN_PRODUCT_LIST_FILTER_LABELS[applied.listFilter],
      onRemove: handlers.onClearStatus,
    });
  }
  if (applied.stockFilter !== "all") {
    chips.push({
      id: "stock",
      label: ADMIN_PRODUCT_STOCK_FILTER_LABELS[applied.stockFilter],
      onRemove: handlers.onClearStock,
    });
  }
  if (applied.featured !== "all") {
    chips.push({
      id: "featured",
      label: ADMIN_PRODUCT_FEATURED_FILTER_LABELS[applied.featured],
      onRemove: handlers.onClearFeatured,
    });
  }
  if (applied.priceMin.trim()) {
    chips.push({
      id: "priceMin",
      label: `Min ${applied.priceMin}`,
      onRemove: handlers.onClearPriceMin,
    });
  }
  if (applied.priceMax.trim()) {
    chips.push({
      id: "priceMax",
      label: `Max ${applied.priceMax}`,
      onRemove: handlers.onClearPriceMax,
    });
  }

  return chips;
}
