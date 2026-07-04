import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatKES } from "@/lib/shop";
import type { CartItem } from "@/lib/cart";

type CheckoutCartReviewSectionProps = {
  items: CartItem[];
  subtotal: number;
};

export function CheckoutCartReviewSection({ items, subtotal }: CheckoutCartReviewSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">Review your cart</h2>
        <Button asChild variant="outline" size="sm">
          <Link to="/cart">Edit cart</Link>
        </Button>
      </div>
      <ul className="divide-y rounded-md border bg-card">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-3 px-4 py-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
              {item.image ? (
                <img src={item.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" aria-hidden />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-primary">
              {formatKES(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-right text-sm text-muted-foreground">
        Subtotal <span className="font-semibold text-foreground">{formatKES(subtotal)}</span>
      </p>
    </section>
  );
}
