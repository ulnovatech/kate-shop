import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ShopLayout } from "@/components/shop-layout";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { useStoreBranding } from "@/lib/store-branding-context";
import { getHomeSeo } from "@/lib/api/seo.server";
import { buildPageHead } from "@/lib/seo";
import { getRootCategories, getDescendantIds, type CategoryRecord } from "@/lib/categories";
import { primaryProductImage, resolveProductImageUrl } from "@/lib/shop";
import { HomeSectionSkeleton } from "@/components/loading-states";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  loader: () => getHomeSeo(),
  head: ({ loaderData }) => {
    const seo = loaderData ?? { title: "Store", description: "" };
    return buildPageHead({
      title: seo.title,
      description: seo.description,
      path: "/",
    });
  },
  component: Home,
});

function Home() {
  const { shopName, whatsapp } = useStoreBranding();
  const { data: allCategories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, sort_order, parent_id")
        .eq("is_hidden", false)
        .is("deleted_at", null)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as CategoryRecord[];
    },
  });

  const categories = useMemo(() => getRootCategories(allCategories), [allCategories]);

  const { data: categoryCoverUrls = {} } = useQuery({
    queryKey: ["category-cover-images", categories.map((c) => c.id).join(",")],
    enabled: categories.length > 0 && allCategories.length > 0,
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from("products")
        .select(
          "category_id, product_images(id, image_url, thumbnail_url, medium_url, full_url, sort_order, is_primary, alt_text)",
        )
        .eq("is_visible", true)
        .eq("is_active", true)
        .is("archived_at", null)
        .is("deleted_at", null)
        .not("category_id", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const covers: Record<string, string> = {};
      for (const root of categories) {
        const descendantIds = new Set(getDescendantIds(root.id, allCategories));
        const match = (products ?? []).find(
          (p) => p.category_id && descendantIds.has(p.category_id),
        );
        if (!match?.product_images?.length) continue;
        const primary = primaryProductImage(match.product_images);
        if (primary) {
          covers[root.id] = resolveProductImageUrl(primary, "medium");
        }
      }
      return covers;
    },
  });

  const { data: featured = [], isLoading: loadingFeatured } = useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, price, stock_quantity, available_stock, is_featured, product_images(id, image_url, thumbnail_url, medium_url, full_url, sort_order, is_primary, alt_text)",
        )
        .eq("is_visible", true)
        .eq("is_active", true)
        .is("archived_at", null)
        .is("deleted_at", null)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as ProductCardData[];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <ShopLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-emerald-deep text-cream">
        <div className="absolute inset-0 opacity-50">
          <img src={heroImg} alt="" role="presentation" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-deep via-emerald-deep/70 to-transparent" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 md:py-32 lg:py-40">
          <div className="max-w-xl">
            <span className="inline-block text-xs font-medium uppercase tracking-[0.25em] text-gold">
              {shopName}
            </span>
            <h1 className="mt-5 font-heading text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
              {settings?.hero_title ?? "Timeless jewelry, crafted in Kampala"}
            </h1>
            <p className="mt-5 max-w-md text-base text-cream/80 sm:text-lg">
              {settings?.hero_subtitle ??
                "Discover handpicked earrings, necklaces, watches, bangles and rings — delivered across Kampala, Uganda."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Link to="/shop">
                  Shop the collection <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-cream/30 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
              >
                <a
                  href={whatsappUrl(`Hello ${shopName}, I'd like to make an inquiry.`, whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> Chat on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-gold">
              Collections
            </span>
            <h2 className="mt-2 font-heading text-3xl font-semibold md:text-4xl">
              Shop by category
            </h2>
          </div>
        </div>
        <div className="gold-divider mt-6" />
        {loadingCategories ? (
          <HomeSectionSkeleton />
        ) : categories.length === 0 ? (
          <div className="mt-10 rounded-md border bg-card px-6 py-12 text-center">
            <p className="font-heading text-lg font-medium">Collections coming soon</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse our full shop while we organise categories.
            </p>
            <Button asChild className="mt-6">
              <Link to="/shop">Shop all products</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {categories.map((c) => {
              const coverSrc = categoryCoverUrls[c.id];
              return (
                <Link
                  key={c.id}
                  to="/shop"
                  search={{ category: c.slug }}
                  className="group relative flex aspect-square items-end overflow-hidden rounded-md border bg-secondary p-4 transition-all hover:border-gold hover:shadow-md"
                >
                  {coverSrc && (
                    <>
                      <img
                        src={coverSrc}
                        alt=""
                        aria-hidden
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/90 via-emerald-deep/40 to-transparent" />
                    </>
                  )}
                  <span
                    className={cn(
                      "relative font-heading text-lg font-medium transition-colors group-hover:text-primary",
                      coverSrc ? "text-cream" : "text-foreground",
                    )}
                  >
                    {c.name}
                  </span>
                  <ArrowRight
                    className={cn(
                      "absolute right-4 top-4 z-10 h-4 w-4 transition-all group-hover:text-gold",
                      coverSrc ? "text-cream/80" : "text-muted-foreground",
                    )}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-gold">
              Featured
            </span>
            <h2 className="mt-2 font-heading text-3xl font-semibold md:text-4xl">New arrivals</h2>
          </div>
          <Link to="/shop" className="inline-flex text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="gold-divider mt-6" />
        {loadingFeatured ? (
          <HomeSectionSkeleton count={4} />
        ) : featured.length === 0 ? (
          <div className="mt-10 rounded-md border bg-card px-6 py-12 text-center">
            <p className="font-heading text-lg font-medium">New pieces on the way</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Fresh arrivals are being added. Explore the full collection in the meantime.
            </p>
            <Button asChild className="mt-6">
              <Link to="/shop">Browse the shop</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* WhatsApp CTA */}
      <section className="mx-auto mb-20 max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl bg-emerald-deep px-6 py-12 text-center text-cream sm:px-12">
          <h3 className="font-heading text-2xl font-semibold sm:text-3xl">
            Looking for something custom?
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-sm text-cream/80">
            Message us on WhatsApp — we'll help you find or design the perfect piece.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
              <a
                href={whatsappUrl(`Hello ${shopName}, I'd like a custom piece.`, whatsapp)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" /> Chat with us
              </a>
            </Button>
          </div>
        </div>
      </section>
    </ShopLayout>
  );
}
