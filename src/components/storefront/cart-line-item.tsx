import { useCallback, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatKES, productImageUrl } from "@/lib/shop";
import type { CartItem } from "@/lib/cart";
import { cn } from "@/lib/utils";

const REVEAL_WIDTH = 72;
const SWIPE_THRESHOLD = 48;

type StockLine = {
  ok: boolean;
  available: number;
  requested: number;
};

type CartLineItemProps = {
  item: CartItem;
  stockLine?: StockLine;
  onSetQty: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
};

export function CartLineItem({ item, stockLine, onSetQty, onRemove }: CartLineItemProps) {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);
  const issue = stockLine && !stockLine.ok;

  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    startX.current = e.touches[0].clientX - offsetX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const next = e.touches[0].clientX - startX.current;
    setOffsetX(Math.min(0, Math.max(-REVEAL_WIDTH, next)));
  };

  const onTouchEnd = () => {
    dragging.current = false;
    setOffsetX((current) => (current < -SWIPE_THRESHOLD ? -REVEAL_WIDTH : 0));
  };

  const closeSwipe = useCallback(() => setOffsetX(0), []);

  const handleRemove = () => {
    onRemove(item.productId);
    closeSwipe();
  };

  return (
    <div className="relative overflow-hidden rounded-md">
      <div
        className="absolute inset-y-0 right-0 flex w-[72px] items-center justify-center bg-destructive text-destructive-foreground"
        aria-hidden={offsetX === 0}
      >
        <button
          type="button"
          onClick={handleRemove}
          className="inline-flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 text-xs font-medium"
          aria-label={`Remove ${item.name}`}
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </button>
      </div>

      <div
        className={cn(
          "relative flex gap-4 border bg-card p-4 transition-transform duration-200 ease-out",
          issue ? "border-amber-300" : "",
        )}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Link
          to="/product/$slug"
          params={{ slug: item.slug }}
          className="block h-24 w-24 shrink-0 overflow-hidden rounded-md bg-secondary"
        >
          {item.image ? (
            <img
              src={productImageUrl(item.image)}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : null}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to="/product/$slug"
                params={{ slug: item.slug }}
                className="font-heading text-sm font-medium hover:text-primary"
              >
                {item.name}
              </Link>
              {issue ? (
                <p className="mt-1 text-xs text-amber-800">
                  Only {stockLine.available} available (you have {stockLine.requested})
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleRemove}
              aria-label={`Remove ${item.name}`}
              className="hidden min-h-11 min-w-11 shrink-0 text-muted-foreground hover:text-destructive sm:inline-flex sm:items-center sm:justify-center"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center rounded-md border">
              <button
                type="button"
                onClick={() => onSetQty(item.productId, item.quantity - 1)}
                className="min-h-11 min-w-11 p-1.5 hover:bg-secondary"
                aria-label={`Decrease quantity of ${item.name}`}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <button
                type="button"
                onClick={() => onSetQty(item.productId, item.quantity + 1)}
                className="min-h-11 min-w-11 p-1.5 hover:bg-secondary"
                aria-label={`Increase quantity of ${item.name}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="text-sm font-semibold text-primary">
              {formatKES(item.price * item.quantity)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
