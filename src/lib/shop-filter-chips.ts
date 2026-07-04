import type { FilterChip } from "@/components/admin/admin-filter-chips";
import type { ShopListFilters } from "@/lib/shop-filters";

type ShopFilterChipHandlers = {
  onClearInStock: () => void;
  onClearFeatured: () => void;
  onClearMinPrice: () => void;
  onClearMaxPrice: () => void;
  onClearCategory: () => void;
  onClearQuery: () => void;
};

export function buildShopFilterChips(
  filters: ShopListFilters,
  handlers: ShopFilterChipHandlers,
  categoryName?: string,
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.q) {
    chips.push({ id: "q", label: `Search: ${filters.q}`, onRemove: handlers.onClearQuery });
  }
  if (filters.category) {
    chips.push({
      id: "category",
      label: categoryName ?? filters.category,
      onRemove: handlers.onClearCategory,
    });
  }
  if (filters.inStockOnly) {
    chips.push({ id: "inStock", label: "In stock only", onRemove: handlers.onClearInStock });
  }
  if (filters.featuredOnly) {
    chips.push({ id: "featured", label: "Featured only", onRemove: handlers.onClearFeatured });
  }
  if (filters.minPrice.trim()) {
    chips.push({
      id: "minPrice",
      label: `Min ${filters.minPrice}`,
      onRemove: handlers.onClearMinPrice,
    });
  }
  if (filters.maxPrice.trim()) {
    chips.push({
      id: "maxPrice",
      label: `Max ${filters.maxPrice}`,
      onRemove: handlers.onClearMaxPrice,
    });
  }

  return chips;
}
