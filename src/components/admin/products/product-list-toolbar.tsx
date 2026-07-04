import { useMemo } from "react";
import { AdminListToolbar, OverlaySearch } from "@/components/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildCategoryTree,
  categorySelectIndent,
  flattenCategoryTreeForSelect,
  type CategoryRecord,
} from "@/lib/categories";
import type { AdminProductListFilters } from "@/lib/list-filters";
import { adminToolbarControl } from "@/lib/admin-mobile";
import { cn } from "@/lib/utils";
import type { ProductListFilter } from "@/lib/catalog";
import { ProductMoreFilters } from "./product-advanced-filters";

type ProductListToolbarProps = {
  draft: AdminProductListFilters;
  categories: CategoryRecord[];
  onQueryChange: (q: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onStatusChange: (status: ProductListFilter) => void;
  onAdvancedChange: (patch: Partial<AdminProductListFilters>) => void;
  onApplySavedView: (filters: AdminProductListFilters) => void;
};

export function ProductListToolbar({
  draft,
  categories,
  onQueryChange,
  onCategoryChange,
  onStatusChange,
  onAdvancedChange,
  onApplySavedView,
}: ProductListToolbarProps) {
  const categoryOptions = useMemo(
    () => flattenCategoryTreeForSelect(buildCategoryTree(categories)),
    [categories],
  );

  return (
    <AdminListToolbar sticky>
      <OverlaySearch
        value={draft.q}
        onChange={onQueryChange}
        searchLabel="Search products"
        placeholder="Name or SKU…"
        inputId="admin-products-search"
      />

      <Select value={draft.categoryId} onValueChange={onCategoryChange}>
        <SelectTrigger
          className={cn(adminToolbarControl, "w-[min(100%,10rem)]")}
          aria-label="Category"
        >
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent position="popper" className="z-[60] max-h-60">
          <SelectItem value="all">All categories</SelectItem>
          {categoryOptions.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {categorySelectIndent(c.depth)}
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ProductMoreFilters
        draft={draft}
        onChange={onAdvancedChange}
        onStatusChange={onStatusChange}
        onApplySavedView={onApplySavedView}
      />
    </AdminListToolbar>
  );
}
