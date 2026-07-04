import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MessageCircle, AlertTriangle, Loader2 } from "lucide-react";
import { ShopLayout } from "@/components/shop-layout";
import { MobileStickyBar } from "@/components/mobile-sticky-bar";
import { CartLineItem } from "@/components/storefront/cart-line-item";
import { WhatsAppOrderBuilderSheet } from "@/components/storefront/whatsapp-order-builder-sheet";
import { StorefrontEmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatKES } from "@/lib/shop";
import { cartItemsToInquiry } from "@/lib/whatsapp-order-builder";
import { useStoreBranding } from "@/lib/store-branding-context";
import { getSiteSeoDefaults } from "@/lib/api/seo.server";
import { buildPageHead, defaultSiteDescription, defaultSiteTitle } from "@/lib/seo";
import { checkCartStock } from "@/lib/api/orders.functions";
import { humanizeError } from "@/lib/errors";

export const Route = createFileRoute("/cart")({
  loader: () => getSiteSeoDefaults(),
  head: ({ loaderData }) => {
    const branding = loaderData?.branding;
    return buildPageHead({
      title: defaultSiteTitle("Cart", branding),
      description: `Your cart at ${branding?.shopName ?? "Store"}.`,
      path: "/cart",
      noIndex: true,
    });
  },
  component: Cart,
});

function Cart() {
  const { shopName, whatsapp } = useStoreBranding();
  const [waOpen, setWaOpen] = useState(false);
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const total = useCart((s) => s.total());

  const {
    data: stockCheck,
    isLoading: checkingStock,
    isError: stockError,
    error: stockCheckError,
  } = useQuery({
    queryKey: ["cart-stock", items.map((i) => `${i.productId}:${i.quantity}`).join(",")],
    queryFn: () =>
      checkCartStock({
        data: {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        },
      }),
    enabled: items.length > 0,
    staleTime: 30_000,
  });

  const stockByProduct = new Map(stockCheck?.lines.map((line) => [line.productId, line]) ?? []);
  const hasStockIssue = stockCheck?.lines.some((line) => !line.ok) ?? false;
  const inquiryItems = cartItemsToInquiry(items);

  return (
    <ShopLayout>
      <div className="mx-auto max-w-5xl px-4 py-12 pb-32 sm:px-6 lg:pb-12">
        <h1 className="font-heading text-3xl font-semibold md:text-4xl">Your cart</h1>
        <div className="gold-divider mt-4" />

        {items.length === 0 ? (
          <div className="mt-16">
            <StorefrontEmptyState
              illustration="cart"
              title="Your cart is empty"
              description="Browse the collection and add pieces you love — checkout takes just a few minutes."
              primaryAction={{ label: "Shop products", to: "/shop" }}
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {checkingStock && (
                <div className="flex items-center gap-2 rounded-md border bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Checking stock availability…
                </div>
              )}
              {stockError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {humanizeError(stockCheckError, {
                    fallback: "Could not verify stock. You can still proceed to checkout.",
                  })}
                </div>
              )}
              {hasStockIssue && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    Some items are no longer available in the quantity you selected. Adjust
                    quantities before checkout.
                  </span>
                </div>
              )}

              {items.map((it) => (
                <CartLineItem
                  key={it.productId}
                  item={it}
                  stockLine={stockByProduct.get(it.productId)}
                  onSetQty={setQty}
                  onRemove={remove}
                />
              ))}
            </div>

            <aside className="h-fit rounded-md border bg-card p-6 lg:sticky lg:top-24">
              <h2 className="font-heading text-lg font-semibold">Order summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatKES(total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery (Kampala)</span>
                  <span>At checkout</span>
                </div>
                <div className="gold-divider my-3" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatKES(total)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button asChild className="w-full" size="lg" disabled={hasStockIssue}>
                  <Link to="/checkout">Checkout</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gold text-primary hover:bg-gold/10"
                  size="lg"
                  onClick={() => setWaOpen(true)}
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> Order on WhatsApp
                </Button>
              </div>
            </aside>
          </div>
        )}

        {items.length > 0 && (
          <MobileStickyBar hideFrom="lg" aboveTabBar>
            <div className="mx-auto flex max-w-5xl items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Subtotal</p>
                <p className="font-heading text-lg font-semibold text-primary">
                  {formatKES(total)}
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="shrink-0 border-gold text-primary"
                aria-label="Order on WhatsApp"
                onClick={() => setWaOpen(true)}
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button asChild size="lg" disabled={hasStockIssue} className="shrink-0">
                <Link to="/checkout">Checkout</Link>
              </Button>
            </div>
          </MobileStickyBar>
        )}

        <WhatsAppOrderBuilderSheet
          open={waOpen}
          onOpenChange={setWaOpen}
          items={inquiryItems}
          shopName={shopName}
          whatsapp={whatsapp}
        />
      </div>
    </ShopLayout>
  );
}
