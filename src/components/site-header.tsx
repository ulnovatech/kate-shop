import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, Heart, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useCustomerSession } from "@/lib/customer-session-context";
import { firstName } from "@/lib/customer-session";
import { useStoreBranding } from "@/lib/store-branding-context";
import { productImageUrl } from "@/lib/shop";
import { SiteSearchSheet, SiteSearchTrigger } from "@/components/site-search-sheet";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const count = useCart((s) => s.count());
  const wishlistCount = useWishlist((s) => s.productIds.length);
  const { session } = useCustomerSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const { shopName, logoUrl } = useStoreBranding();
  const logoSrc = logoUrl?.startsWith("http") ? logoUrl : logoUrl ? productImageUrl(logoUrl) : null;
  const ordersLabel = session?.name ? `Hi, ${firstName(session.name)}` : "Your orders";

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex min-h-11 items-center gap-2">
          {logoSrc ? (
            <img src={logoSrc} alt={shopName} className="h-9 w-auto max-w-[140px] object-contain" />
          ) : (
            <span className="font-heading text-xl font-semibold tracking-tight text-primary">
              {shopName}
            </span>
          )}
        </Link>

        <nav className="hidden gap-8 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary [&.active]:text-primary"
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <SiteSearchTrigger
            onClick={() => setSearchOpen(true)}
            className="min-h-11 min-w-11 lg:hidden"
          />
          <Link
            to="/orders"
            aria-label={ordersLabel}
            className={cn(
              "relative hidden min-h-11 min-w-11 items-center justify-center rounded-md text-foreground/80 hover:bg-accent hover:text-accent-foreground md:inline-flex sm:min-w-0 sm:gap-1.5 sm:px-2 sm:text-sm sm:font-medium",
            )}
          >
            <Package className="h-5 w-5 shrink-0" />
            <span className="hidden max-w-[7rem] truncate sm:inline">{ordersLabel}</span>
          </Link>
          <Link
            to="/wishlist"
            aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : "Wishlist"}
            className={cn(
              "relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-foreground/80 hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-semibold text-gold-foreground">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link
            to="/cart"
            aria-label={count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
            className={cn(
              "relative hidden min-h-11 min-w-11 items-center justify-center rounded-md text-foreground/80 hover:bg-accent hover:text-accent-foreground md:inline-flex",
            )}
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-semibold text-gold-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      <SiteSearchSheet open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
