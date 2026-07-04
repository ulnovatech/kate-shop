import { Link, useNavigate } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import { ShoppingBag } from "lucide-react";
import {
  formatKES,
  primaryProductImage,
  productImageAlt,
  resolveProductImageUrl,
  type ProductImageFields,
} from "@/lib/shop";
import { isInStock, maxPurchasable } from "@/lib/inventory";
import { humanStockAvailability } from "@/lib/human-labels";
import { useCart } from "@/lib/cart";
import { showAddedToCartToast } from "@/lib/cart-toast";
import { WishlistButton } from "@/components/wishlist-button";
import { cn } from "@/lib/utils";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock_quantity: number;
  available_stock?: number;
  product_images: ProductImageFields[];
};

export function ProductCard({ p }: { p: ProductCardData }) {
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const primary = primaryProductImage(p.product_images);
  const src = primary ? resolveProductImageUrl(primary, "medium") : "";
  const alt = productImageAlt(primary, p.name);
  const out = !isInStock({ available_stock: p.available_stock ?? p.stock_quantity });
  const maxQty = maxPurchasable({ available_stock: p.available_stock ?? p.stock_quantity });
  const stockCopy = humanStockAvailability(maxQty);

  const handleQuickAdd = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (out) return;

    const image = primary?.medium_url ?? primary?.thumbnail_url ?? primary?.image_url ?? "";
    add(
      {
        productId: p.id,
        name: p.name,
        slug: p.slug,
        price: parseFloat(String(p.price)),
        image,
      },
      1,
    );
    showAddedToCartToast(p.name, () => navigate({ to: "/cart" }));
  };

  return (
    <article className="group">
      <div className="relative aspect-square overflow-hidden rounded-md border border-border/60 bg-secondary shadow-sm">
        <Link
          to="/product/$slug"
          params={{ slug: p.slug }}
          preload="intent"
          className="block h-full w-full"
          aria-label={`View ${p.name}`}
        >
          {src ? (
            <img
              src={src}
              alt={alt}
              loading="lazy"
              decoding="async"
              width={800}
              height={800}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </Link>

        <div className="absolute right-2 top-2 z-10">
          <WishlistButton productId={p.id} productName={p.name} />
        </div>

        {!out && (
          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label={`Add ${p.name} to cart`}
            className={cn(
              "absolute bottom-2 right-2 z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:border-gold hover:bg-secondary hover:text-primary",
              "opacity-100 md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
            )}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
          </button>
        )}

        {out ? (
          <span className="absolute left-3 top-3 rounded-full bg-foreground/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-background">
            Sold out
          </span>
        ) : stockCopy.tone === "low" ? (
          <span className="absolute left-3 top-3 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-medium text-amber-900">
            {stockCopy.label}
          </span>
        ) : null}
      </div>

      <Link to="/product/$slug" params={{ slug: p.slug }} preload="intent" className="mt-3 block">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-sm font-medium text-foreground group-hover:text-primary">
            {p.name}
          </h3>
          <span className="whitespace-nowrap text-sm font-semibold text-primary">
            {formatKES(p.price)}
          </span>
        </div>
      </Link>
    </article>
  );
}
