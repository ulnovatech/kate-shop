import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { ShopLayout } from "@/components/shop-layout";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { useCustomerSession } from "@/lib/customer-session-context";
import { useWishlist } from "@/lib/wishlist";
import { listWishlist } from "@/lib/api/wishlist.functions";
import { supabase } from "@/integrations/supabase/client";
import { ProductGridSkeleton } from "@/components/loading-states";
import type { ProductCardData } from "@/components/product-card";
import { buildPageHead, defaultSiteTitle } from "@/lib/seo";
import { getSiteSeoDefaults } from "@/lib/api/seo.server";

export const Route = createFileRoute("/wishlist")({
  loader: () => getSiteSeoDefaults(),
  head: ({ loaderData }) =>
    buildPageHead({
      title: defaultSiteTitle("Wishlist", loaderData?.branding),
      description: "Items you saved for later.",
      path: "/wishlist",
      noIndex: true,
    }),
  component: WishlistPage,
});

function WishlistPage() {
  const { session } = useCustomerSession();
  const localIds = useWishlist((s) => s.productIds);

  const { data: serverItems = [], isLoading: loadingServer } = useQuery({
    queryKey: ["wishlist", session?.customerId],
    queryFn: () => listWishlist({ data: { customerId: session!.customerId } }),
    enabled: !!session?.customerId,
  });

  const { data: localProducts = [], isLoading: loadingLocal } = useQuery({
    queryKey: ["wishlist-local", localIds.join(",")],
    queryFn: async () => {
      if (!localIds.length) return [];
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, price, stock_quantity, available_stock, product_images(id, image_url, thumbnail_url, medium_url, full_url, sort_order, is_primary, alt_text)",
        )
        .in("id", localIds)
        .eq("is_visible", true)
        .eq("is_active", true)
        .is("archived_at", null)
        .is("deleted_at", null);
      if (error) throw error;
      return (data ?? []) as ProductCardData[];
    },
    enabled: !session?.customerId && localIds.length > 0,
  });

  const products = session?.customerId
    ? serverItems.map((i) => i.product)
    : localProducts.filter((p) => localIds.includes(p.id));

  const isLoading = session?.customerId ? loadingServer : loadingLocal && localIds.length > 0;

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="font-heading text-3xl font-semibold md:text-4xl">Wishlist</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {session?.customerId
            ? "Synced to your profile."
            : "Saved on this device. Place an order to keep your wishlist when you switch phones."}
        </p>
        <div className="gold-divider mt-4" />

        {isLoading ? (
          <div className="mt-10">
            <ProductGridSkeleton count={4} />
          </div>
        ) : products.length === 0 ? (
          <div className="mt-16 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Nothing saved yet.</p>
            <Button asChild className="mt-6">
              <Link to="/shop">Discover products</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
