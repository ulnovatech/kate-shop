import type { AdminProduct } from "./types";

export function ProductStatusPills({ product }: { product: AdminProduct }) {
  const archived = !!product.archived_at;
  const available = product.available_stock ?? product.stock_quantity;
  const low = available > 0 && available <= (product.low_stock_threshold ?? 5);

  return (
    <div className="flex flex-wrap gap-1">
      {archived ? (
        <span className="rounded-full bg-muted px-2 py-0.5 type-caption text-muted-foreground">
          Archived
        </span>
      ) : null}
      {product.is_featured ? (
        <span className="rounded-full bg-gold/20 px-2 py-0.5 type-caption text-gold">Featured</span>
      ) : null}
      <span
        className={`rounded-full px-2 py-0.5 type-caption ${
          product.is_visible && !archived
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {product.is_visible && !archived ? "Visible" : "Hidden"}
      </span>
      {low ? (
        <span className="rounded-full bg-surface-attention px-2 py-0.5 type-caption text-surface-attention-foreground">
          Low stock
        </span>
      ) : null}
      {available === 0 ? (
        <span className="rounded-full bg-surface-danger px-2 py-0.5 type-caption text-surface-danger-foreground">
          Out of stock
        </span>
      ) : null}
    </div>
  );
}
