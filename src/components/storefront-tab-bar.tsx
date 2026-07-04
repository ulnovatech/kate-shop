import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Menu, Package, ShoppingBag, Store } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useStorefrontChrome } from "@/lib/storefront-chrome-context";
import { cn } from "@/lib/utils";

function isShopActive(path: string): boolean {
  return path === "/" || path.startsWith("/shop") || path.startsWith("/product/");
}

function isWishlistActive(path: string): boolean {
  return path.startsWith("/wishlist");
}

function isOrdersActive(path: string): boolean {
  return path.startsWith("/orders") || path.startsWith("/order/");
}

function isCartActive(path: string): boolean {
  return path === "/cart";
}

export function StorefrontTabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const cartCount = useCart((s) => s.count());
  const wishlistCount = useWishlist((s) => s.productIds.length);
  const { moreNavOpen, setMoreNavOpen } = useStorefrontChrome();

  const tabs = [
    {
      kind: "link" as const,
      label: "Shop",
      icon: Store,
      to: "/shop" as const,
      active: isShopActive(path),
    },
    {
      kind: "link" as const,
      label: "Wishlist",
      icon: Heart,
      to: "/wishlist" as const,
      active: isWishlistActive(path),
      badge: wishlistCount,
    },
    {
      kind: "link" as const,
      label: "Cart",
      icon: ShoppingBag,
      to: "/cart" as const,
      active: isCartActive(path),
      badge: cartCount,
    },
    {
      kind: "link" as const,
      label: "Orders",
      icon: Package,
      to: "/orders" as const,
      active: isOrdersActive(path),
    },
    {
      kind: "button" as const,
      label: "More",
      icon: Menu,
      active: moreNavOpen,
      onClick: () => setMoreNavOpen(true),
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background/95 pb-[env(safe-area-inset-bottom)] text-foreground backdrop-blur md:hidden"
      style={{ height: "calc(var(--storefront-tab-height) + env(safe-area-inset-bottom))" }}
      aria-label="Store navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const inner = (
          <>
            <span className="relative">
              <Icon className="h-5 w-5" aria-hidden />
              {tab.kind === "link" && tab.badge != null && tab.badge > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-0.5 text-[10px] font-semibold text-gold-foreground">
                  {tab.badge > 9 ? "9+" : tab.badge}
                </span>
              )}
            </span>
            <span>{tab.label}</span>
          </>
        );

        const className = cn(
          "flex min-h-[var(--storefront-tab-height)] flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-medium transition-colors",
          tab.active ? "text-primary" : "text-muted-foreground",
        );

        if (tab.kind === "link") {
          return (
            <Link
              key={tab.label}
              to={tab.to}
              className={className}
              aria-current={tab.active ? "page" : undefined}
            >
              {inner}
            </Link>
          );
        }

        return (
          <button
            key={tab.label}
            type="button"
            className={className}
            aria-label="Open menu"
            aria-expanded={moreNavOpen}
            onClick={tab.onClick}
          >
            {inner}
          </button>
        );
      })}
    </nav>
  );
}
