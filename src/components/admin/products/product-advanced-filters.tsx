import { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, Trash2 } from "lucide-react";
import {
  ADMIN_PRODUCT_FEATURED_FILTER_LABELS,
  ADMIN_PRODUCT_LIST_FILTER_LABELS,
  ADMIN_PRODUCT_STOCK_FILTER_LABELS,
} from "@/lib/admin-product-list-query";
import type { AdminProductListFilters } from "@/lib/list-filters";
import type { ProductListFilter } from "@/lib/catalog";
import { adminToolbarControl } from "@/lib/admin-mobile";
import { PRODUCT_LIST_PRESETS } from "@/lib/admin-list-presets";
import { SAVED_LIST_VIEW_KEYS } from "@/lib/saved-list-views";
import {
  deleteSavedListView,
  getSavedListViews,
  saveListView,
  type SavedListView,
} from "@/lib/saved-list-views";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: ProductListFilter; label: string }[] = [
  { value: "active", label: ADMIN_PRODUCT_LIST_FILTER_LABELS.active },
  { value: "archived", label: ADMIN_PRODUCT_LIST_FILTER_LABELS.archived },
  { value: "all", label: ADMIN_PRODUCT_LIST_FILTER_LABELS.all },
];

type ProductMoreFiltersProps = {
  draft: AdminProductListFilters;
  onChange: (patch: Partial<AdminProductListFilters>) => void;
  onStatusChange: (status: ProductListFilter) => void;
  onApplySavedView: (filters: AdminProductListFilters) => void;
};

export function ProductMoreFilters({
  draft,
  onChange,
  onStatusChange,
  onApplySavedView,
}: ProductMoreFiltersProps) {
  const storageKey = SAVED_LIST_VIEW_KEYS.adminProducts;
  const [views, setViews] = useState<SavedListView<AdminProductListFilters>[]>(() =>
    getSavedListViews<AdminProductListFilters>(storageKey),
  );
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  const refreshViews = () => setViews(getSavedListViews<AdminProductListFilters>(storageKey));

  const activeCount = useMemo(
    () =>
      Number(draft.listFilter !== "active") +
      Number(draft.stockFilter !== "all") +
      Number(draft.featured !== "all") +
      Number(Boolean(draft.priceMin.trim())) +
      Number(Boolean(draft.priceMax.trim())),
    [draft],
  );

  const handleSaveView = () => {
    const name = saveName.trim();
    if (!name) return;
    saveListView(storageKey, name, draft);
    setSaveName("");
    setSaving(false);
    refreshViews();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(adminToolbarControl, "gap-1.5 px-2.5 md:px-3")}
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
          <span>More</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="z-[60] w-72 space-y-4 p-4">
        <div>
          <Label>Status</Label>
          <Select value={draft.listFilter} onValueChange={(v) => onStatusChange(v as ProductListFilter)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="item-aligned" className="z-[70] max-h-60">
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Stock</Label>
          <Select
            value={draft.stockFilter}
            onValueChange={(v) =>
              onChange({ stockFilter: v as AdminProductListFilters["stockFilter"] })
            }
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="item-aligned" className="z-[70] max-h-60">
              {Object.entries(ADMIN_PRODUCT_STOCK_FILTER_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Featured</Label>
          <Select
            value={draft.featured}
            onValueChange={(v) => onChange({ featured: v as AdminProductListFilters["featured"] })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="item-aligned" className="z-[70] max-h-60">
              {Object.entries(ADMIN_PRODUCT_FEATURED_FILTER_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="product-min-price">Min price</Label>
            <Input
              id="product-min-price"
              type="number"
              min={0}
              value={draft.priceMin}
              onChange={(e) => onChange({ priceMin: e.target.value })}
              className="mt-1.5"
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="product-max-price">Max price</Label>
            <Input
              id="product-max-price"
              type="number"
              min={0}
              value={draft.priceMax}
              onChange={(e) => onChange({ priceMax: e.target.value })}
              className="mt-1.5"
              placeholder="Any"
            />
          </div>
        </div>

        <div className="border-t pt-3">
          <Label className="type-caption text-muted-foreground">Saved views</Label>
          {saving ? (
            <div className="mt-2 space-y-2">
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="View name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveView();
                }}
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" className="flex-1" onClick={handleSaveView}>
                  Save
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setSaving(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 h-8 w-full justify-start px-2"
              onClick={() => setSaving(true)}
            >
              Save current filters…
            </Button>
          )}
          {PRODUCT_LIST_PRESETS.length > 0 || views.length > 0 ? (
            <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto">
              {PRODUCT_LIST_PRESETS.map((preset) => (
                <li key={`preset-${preset.name}`}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                    onClick={() => onApplySavedView(preset.filters)}
                  >
                    {preset.name}
                  </button>
                </li>
              ))}
              {views.map((view) => (
                <li key={view.id}>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => onApplySavedView(view.filters)}
                    >
                      <span className="truncate">{view.name}</span>
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${view.name}`}
                      onClick={() => {
                        deleteSavedListView(storageKey, view.id);
                        refreshViews();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** @deprecated Use ProductMoreFilters */
export const ProductAdvancedFilters = ProductMoreFilters;
