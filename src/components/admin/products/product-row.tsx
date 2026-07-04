import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useRef } from "react";
import { Archive, PenLine, Trash2 } from "lucide-react";
import { formatKES, primaryProductImage, resolveProductImageUrl } from "@/lib/shop";
import { isLowStock } from "@/lib/catalog";
import { adminProductEditTarget } from "@/lib/admin-routes";
import { cn } from "@/lib/utils";
import { LIST_ITEM_PERF_CLASS } from "@/lib/perf-perception";
import { useLongPress } from "@/hooks/use-long-press";
import { SwipeableListRow } from "@/components/admin/swipeable-list-row";
import { ProductActionsMenu } from "./product-actions-menu";
import { ProductSelectCheckbox } from "./product-select-checkbox";
import { ProductStatusPills } from "./product-status-pills";
import type { AdminProduct, ProductRecycleTarget } from "./types";

export const PRODUCT_LIST_GRID_CLASS =
  "md:grid md:grid-cols-[auto_minmax(0,1.6fr)_minmax(0,0.9fr)_5.5rem_4rem_minmax(0,1fr)_minmax(11rem,auto)] md:items-center md:gap-3";

export const PRODUCT_LIST_GRID_SELECTION_CLASS =
  "md:grid md:grid-cols-[auto_minmax(0,1.6fr)_minmax(0,0.9fr)_5.5rem_4rem_minmax(0,1fr)_3rem] md:items-center md:gap-3";

/** ~1s hold to enter selection mode on touch devices. */
export const PRODUCT_LONG_PRESS_MS = 1_000;

const PRODUCT_ROW_SEPARATOR = "border-b border-border/50";

type ProductRowProps = {
  product: AdminProduct;
  onToggleFeatured: () => void;
  onToggleVisible: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onRecycle: (target: ProductRecycleTarget) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onSelectedChange?: (id: string, selected: boolean) => void;
  onEnterSelectionMode?: (id: string) => void;
};

export function ProductRow({
  product,
  onToggleFeatured,
  onToggleVisible,
  onDuplicate,
  onArchive,
  onRestore,
  onRecycle,
  selectionMode = false,
  selected = false,
  onSelectedChange,
  onEnterSelectionMode,
}: ProductRowProps) {
  const navigate = useNavigate();
  const suppressNextClick = useRef(false);
  const primary = primaryProductImage(product.product_images ?? []);
  const imgSrc = primary ? resolveProductImageUrl(primary, "thumb") : "";
  const available = product.available_stock ?? product.stock_quantity;
  const low = isLowStock(available, product.low_stock_threshold ?? 5);
  const archived = !!product.archived_at;
  const editTarget = adminProductEditTarget(product.id);

  const toggleSelected = () => {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    onSelectedChange?.(product.id, !selected);
  };

  const handleLongPress = useCallback(() => {
    if (selectionMode) return;
    suppressNextClick.current = true;
    onEnterSelectionMode?.(product.id);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12);
    }
  }, [onEnterSelectionMode, product.id, selectionMode]);

  const longPressHandlers = useLongPress(handleLongPress, {
    delayMs: PRODUCT_LONG_PRESS_MS,
    moveThreshold: 12,
  });

  const swallowClickAfterLongPress = (event: {
    preventDefault: () => void;
    stopPropagation?: () => void;
  }) => {
    if (suppressNextClick.current) {
      event.preventDefault();
      event.stopPropagation?.();
      suppressNextClick.current = false;
    }
  };

  const selectionCheckbox = (
    <ProductSelectCheckbox
      checked={selected}
      onCheckedChange={(checked) => onSelectedChange?.(product.id, checked)}
      aria-label={`Select ${product.name}`}
    />
  );

  const productThumb = (
    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted md:h-11 md:w-11">
      {imgSrc ? (
        <img src={imgSrc} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center type-caption text-muted-foreground">
          No img
        </span>
      )}
    </div>
  );

  const mobileRow = selectionMode ? (
    <article
      className={cn(
        PRODUCT_ROW_SEPARATOR,
        "p-4 transition-common md:hidden",
        LIST_ITEM_PERF_CLASS,
        selected && "bg-emerald-50/80 dark:bg-emerald-950/20",
        archived && "opacity-75",
      )}
      onClick={toggleSelected}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleSelected();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
    >
      <div className="flex items-center gap-3">
        {productThumb}
        <div className="min-w-0 flex-1">
          <p className="type-body-sm font-medium">{product.name}</p>
          <p className="type-caption text-muted-foreground">
            {product.categories?.name ?? "Uncategorized"} · {formatKES(product.price)}
          </p>
          <p className="type-caption text-muted-foreground">
            {product.sku ? `SKU ${product.sku}` : "No SKU"} · Stock {available}
          </p>
          <div className="mt-1.5">
            <ProductStatusPills product={product} />
          </div>
        </div>
        <div className="shrink-0 self-center" onClick={(e) => e.stopPropagation()}>
          {selectionCheckbox}
        </div>
      </div>
    </article>
  ) : (
    <article
      className={cn(
        PRODUCT_ROW_SEPARATOR,
        "select-none p-4 transition-common md:hidden",
        LIST_ITEM_PERF_CLASS,
        archived && "opacity-75",
      )}
      {...longPressHandlers}
      onClick={swallowClickAfterLongPress}
      style={{ touchAction: "pan-y" }}
    >
      <div className="flex items-center gap-3">
        {productThumb}
        <div className="min-w-0 flex-1">
          <p className="type-body-sm font-medium">{product.name}</p>
          <p className="type-caption text-muted-foreground">
            {product.categories?.name ?? "Uncategorized"} · {formatKES(product.price)}
          </p>
          <p className="type-caption text-muted-foreground">
            {product.sku ? `SKU ${product.sku}` : "No SKU"} · Stock {available}
            {low && available > 0 ? " · Low" : ""}
          </p>
          <div className="mt-1.5">
            <ProductStatusPills product={product} />
          </div>
        </div>
      </div>
      <div
        className="mt-3"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <ProductActionsMenu
          product={product}
          onToggleFeatured={onToggleFeatured}
          onToggleVisible={onToggleVisible}
          onDuplicate={onDuplicate}
          onArchive={onArchive}
          onRestore={onRestore}
          onRecycle={onRecycle}
        />
      </div>
    </article>
  );

  const desktopRow = (
    <article
      className={cn(
        PRODUCT_ROW_SEPARATOR,
        "hidden p-4 transition-common hover:bg-muted/20 md:grid",
        LIST_ITEM_PERF_CLASS,
        selectionMode ? PRODUCT_LIST_GRID_SELECTION_CLASS : PRODUCT_LIST_GRID_CLASS,
        archived && "opacity-75",
        selectionMode && selected && "bg-emerald-50/80 dark:bg-emerald-950/20",
      )}
      {...(selectionMode ? {} : longPressHandlers)}
      onClick={(event) => {
        swallowClickAfterLongPress(event);
        if (selectionMode) toggleSelected();
      }}
    >
      {!selectionMode ? (
        <div className="hidden md:block md:w-4" aria-hidden />
      ) : (
        <span aria-hidden className="hidden md:block" />
      )}

      <div className="flex min-w-0 gap-3 md:contents">
        {selectionMode ? (
          productThumb
        ) : (
          <Link
            {...editTarget}
            onClick={(e) => {
              swallowClickAfterLongPress(e);
            }}
            className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted md:h-11 md:w-11"
          >
            {imgSrc ? (
              <img src={imgSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center type-caption text-muted-foreground">
                No img
              </span>
            )}
          </Link>
        )}

        <div className="min-w-0 flex-1 md:col-start-2 md:row-start-1 md:flex md:items-center md:gap-3">
          <div className="min-w-0">
            {selectionMode ? (
              <p className="type-body-sm font-medium">{product.name}</p>
            ) : (
              <Link
                {...editTarget}
                className="type-body-sm font-medium hover:text-primary"
                onClick={(e) => swallowClickAfterLongPress(e)}
              >
                {product.name}
              </Link>
            )}
            <p className="type-caption text-muted-foreground">
              {product.sku ? `SKU ${product.sku}` : "No SKU"}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-2 hidden type-body-sm text-muted-foreground md:mt-0 md:block">
        {product.categories?.name ?? "—"}
      </p>

      <p className="hidden font-medium md:block">{formatKES(product.price)}</p>

      <p className="hidden md:block">
        <span
          className={cn(
            "type-body-sm tabular-nums",
            available === 0 && "text-destructive",
            low && available > 0 && "text-amber-600",
          )}
        >
          {available}
        </span>
      </p>

      <div className="mt-2 md:mt-0">
        <ProductStatusPills product={product} />
      </div>

      <div className="mt-3 md:mt-0 md:flex md:justify-end">
        {selectionMode ? (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            {selectionCheckbox}
          </div>
        ) : (
          <ProductActionsMenu
            product={product}
            onToggleFeatured={onToggleFeatured}
            onToggleVisible={onToggleVisible}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onRestore={onRestore}
            onRecycle={onRecycle}
          />
        )}
      </div>
    </article>
  );

  return (
    <SwipeableListRow
      enabled={false}
      actions={[
        {
          id: "edit",
          label: "Edit",
          icon: <PenLine className="h-4 w-4" aria-hidden />,
          onClick: () => navigate(editTarget),
        },
        {
          id: "archive",
          label: archived ? "Restore" : "Archive",
          icon: <Archive className="h-4 w-4" aria-hidden />,
          onClick: () => (archived ? onRestore() : onArchive()),
        },
        {
          id: "delete",
          label: "Delete",
          icon: <Trash2 className="h-4 w-4" aria-hidden />,
          destructive: true,
          onClick: () => onRecycle({ id: product.id, name: product.name }),
        },
      ]}
    >
      {mobileRow}
      {desktopRow}
    </SwipeableListRow>
  );
}

export function ProductListHeader({ selectionMode = false }: { selectionMode?: boolean }) {
  return (
    <header
      className={cn(
        "hidden border-b bg-muted/40 px-4 py-2.5 type-overline text-muted-foreground md:grid",
        selectionMode ? PRODUCT_LIST_GRID_SELECTION_CLASS : PRODUCT_LIST_GRID_CLASS,
      )}
    >
      {!selectionMode ? <span className="sr-only">Select</span> : null}
      {!selectionMode ? <span aria-hidden /> : <span aria-hidden />}
      <span>Product</span>
      <span>Category</span>
      <span>Price</span>
      <span>Stock</span>
      <span>Status</span>
      <span className="text-right">{selectionMode ? "Select" : "Actions"}</span>
    </header>
  );
}
