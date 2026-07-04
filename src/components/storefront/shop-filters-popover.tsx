import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SlidersHorizontal } from "lucide-react";
import type { ShopListFilters } from "@/lib/shop-filters";

type ShopFiltersPopoverProps = {
  filters: ShopListFilters;
  onChange: (patch: Partial<ShopListFilters>) => void;
  onApply: () => void;
};

export function ShopFiltersPopover({ filters, onChange, onApply }: ShopFiltersPopoverProps) {
  const activeCount =
    Number(filters.inStockOnly) +
    Number(filters.featuredOnly) +
    Number(Boolean(filters.minPrice.trim())) +
    Number(Boolean(filters.maxPrice.trim()));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0"
          aria-label="Filter products"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden />
          Filters
          {activeCount > 0 ? (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="shop-in-stock">In stock only</Label>
          <Switch
            id="shop-in-stock"
            checked={filters.inStockOnly}
            onCheckedChange={(checked) => onChange({ inStockOnly: checked })}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="shop-featured">Featured only</Label>
          <Switch
            id="shop-featured"
            checked={filters.featuredOnly}
            onCheckedChange={(checked) => onChange({ featuredOnly: checked })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="shop-min-price">Min price</Label>
            <Input
              id="shop-min-price"
              type="number"
              min={0}
              inputMode="numeric"
              value={filters.minPrice}
              onChange={(e) => onChange({ minPrice: e.target.value })}
              className="mt-1.5"
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="shop-max-price">Max price</Label>
            <Input
              id="shop-max-price"
              type="number"
              min={0}
              inputMode="numeric"
              value={filters.maxPrice}
              onChange={(e) => onChange({ maxPrice: e.target.value })}
              className="mt-1.5"
              placeholder="Any"
            />
          </div>
        </div>
        <Button type="button" className="w-full" onClick={onApply}>
          Apply filters
        </Button>
      </PopoverContent>
    </Popover>
  );
}
