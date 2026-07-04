import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShopSearchPanel } from "@/components/shop-search-panel";
import { StorefrontOverlaySearch } from "@/components/storefront/overlay-search";
import { SHOP_SORT_OPTIONS, type ShopSort } from "@/lib/shop-sort";
import { cn } from "@/lib/utils";

type ShopToolbarProps = {
  sort: ShopSort;
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: (term: string) => void;
  onClearSearch: () => void;
  onSearchFocusChange?: (focused: boolean) => void;
  onSortChange: (sort: ShopSort) => void;
  categoryChips: ReactNode;
  filtersSlot?: ReactNode;
  className?: string;
};

export function ShopToolbar({
  sort,
  query,
  onQueryChange,
  onSearch,
  onClearSearch,
  onSearchFocusChange,
  onSortChange,
  categoryChips,
  filtersSlot,
  className,
}: ShopToolbarProps) {
  const sortSelect = (
    <Select value={sort} onValueChange={(v) => onSortChange(v as ShopSort)}>
      <SelectTrigger className="h-11 w-[9.5rem] shrink-0 sm:w-44" aria-label="Sort products">
        <SlidersHorizontal className="mr-2 h-4 w-4 shrink-0 opacity-60" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SHOP_SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
        {categoryChips}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
          <StorefrontOverlaySearch
            value={query}
            onChange={onQueryChange}
            onClear={onClearSearch}
            onSubmit={() => onSearch(query)}
            searchLabel="Search products"
            placeholder="Name, SKU, category…"
            inputId="shop-toolbar-search"
            sheetChildren={
              <ShopSearchPanel
                value={query}
                onChange={onQueryChange}
                onSearch={onSearch}
                onClear={onClearSearch}
                active
                layout="stacked"
                autoFocus
                inputId="shop-mobile-search-suggestions"
              />
            }
          />
        </div>

        <div className="hidden min-w-0 flex-1 md:block">
          <ShopSearchPanel
            value={query}
            onChange={onQueryChange}
            onSearch={onSearch}
            onClear={onClearSearch}
            onFocusChange={onSearchFocusChange}
            className="w-full max-w-md"
            inputId="shop-desktop-search"
          />
        </div>

        {sortSelect}
        {filtersSlot}
      </div>
    </div>
  );
}

export function ShopCategoryChip({
  active,
  children,
  to,
  search,
}: {
  active: boolean;
  children: ReactNode;
  to: string;
  search?: Record<string, string | undefined>;
}) {
  return (
    <Link
      to={to}
      search={search}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 py-2 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:border-gold",
      )}
    >
      {children}
    </Link>
  );
}
