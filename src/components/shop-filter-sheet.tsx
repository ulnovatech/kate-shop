import { Link } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { CategoryRecord } from "@/lib/categories";
import { SHOP_SORT_OPTIONS, type ShopSort } from "@/lib/shop-sort";
import { cn } from "@/lib/utils";

type ShopFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: string;
  q?: string;
  sort: ShopSort;
  activeCategory?: CategoryRecord;
  chipCategories: CategoryRecord[];
  subcategories: CategoryRecord[];
  onSortChange: (sort: ShopSort) => void;
};

function categoryChipClass(active: boolean) {
  return cn(
    "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-xs font-medium transition-colors",
    active ? "border-primary bg-primary text-primary-foreground" : "hover:border-gold",
  );
}

export function ShopFilterSheet({
  open,
  onOpenChange,
  category,
  q,
  sort,
  activeCategory,
  chipCategories,
  subcategories,
  onSortChange,
}: ShopFilterSheetProps) {
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
        aria-describedby={undefined}
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-heading">Filter &amp; sort</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sort
            </p>
            <Select value={sort} onValueChange={(v) => onSortChange(v as ShopSort)}>
              <SelectTrigger className="mt-2 h-11 w-full" aria-label="Sort products">
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
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Categories
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/shop"
                search={category || q ? { q, sort } : { sort }}
                onClick={close}
                className={categoryChipClass(!category)}
              >
                {category ? "← All" : "All"}
              </Link>
              {category && activeCategory && (
                <Link
                  to="/shop"
                  search={{ category: activeCategory.slug, q, sort }}
                  onClick={close}
                  className={categoryChipClass(subcategories.length === 0)}
                >
                  {activeCategory.name} (all)
                </Link>
              )}
              {chipCategories.map((c) => (
                <Link
                  key={c.id}
                  to="/shop"
                  search={{ category: c.slug, q, sort }}
                  onClick={close}
                  className={categoryChipClass(category === c.slug)}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ShopFilterTrigger({
  onClick,
  label,
  className,
}: {
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("min-h-11 shrink-0 gap-2", className)}
      onClick={onClick}
      aria-label="Filter and sort products"
    >
      <SlidersHorizontal className="h-4 w-4" aria-hidden />
      {label}
    </Button>
  );
}
