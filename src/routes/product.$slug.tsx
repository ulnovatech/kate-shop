import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MessageCircle, ShoppingBag, Minus, Plus, Share2 } from "lucide-react";
import { ProductDetailSkeleton } from "@/components/loading-states";
import { ShopLayout } from "@/components/shop-layout";
import { MobileStickyBar } from "@/components/mobile-sticky-bar";
import { ProductImageLightbox } from "@/components/product-image-lightbox";
import { ProductShareSheet } from "@/components/product-share-sheet";
import { WhatsAppOrderBuilderSheet } from "@/components/storefront/whatsapp-order-builder-sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { showAddedToCartToast } from "@/lib/cart-toast";
import { isInStock, maxPurchasable } from "@/lib/inventory";
import { humanStockAvailability } from "@/lib/human-labels";
import { humanizeError } from "@/lib/errors";
import { getProductPageData } from "@/lib/api/seo.server";
import {
  buildBreadcrumbJsonLd,
  buildPageHead,
  buildProductJsonLd,
  defaultSiteTitle,
  jsonLdScript,
} from "@/lib/seo";
import { formatKES, productImageAlt, resolveProductImageUrl, sortProductImages } from "@/lib/shop";
import { useStoreBranding } from "@/lib/store-branding-context";
import { WishlistButton } from "@/components/wishlist-button";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => getProductPageData({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return buildPageHead({
        title: defaultSiteTitle("Product not found"),
        description: "This product could not be found.",
        path: "/shop",
        noIndex: true,
      });
    }
    const head = buildPageHead({
      title: loaderData.seoTitle,
      description: loaderData.seoDescription,
      path: `/product/${loaderData.slug}`,
      image: loaderData.imageUrl,
      type: "product",
    });
    const productLd = buildProductJsonLd(
      {
        name: loaderData.name,
        description: loaderData.description,
        slug: loaderData.slug,
        price: loaderData.price,
        sku: loaderData.sku,
        imageUrl: loaderData.imageUrl,
        inStock: loaderData.inStock,
        categoryName: loaderData.categoryName,
      },
      loaderData.branding,
    );
    const breadcrumbLd = buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Shop", path: "/shop" },
      ...(loaderData.categorySlug && loaderData.categoryName
        ? [{ name: loaderData.categoryName, path: `/shop?category=${loaderData.categorySlug}` }]
        : []),
      { name: loaderData.name, path: `/product/${loaderData.slug}` },
    ]);
    return {
      ...head,
      scripts: [jsonLdScript([productLd, breadcrumbLd])],
    };
  },
  component: Product,
});

function Product() {
  const { slug } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const navigate = useNavigate();
  const { shopName, whatsapp } = useStoreBranding();
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [waOpen, setWaOpen] = useState(false);

  const toastAddedToCart = (productName: string) => {
    showAddedToCartToast(productName, () => navigate({ to: "/cart" }));
  };

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductPageData({ data: { slug } }),
    initialData: loaderData ?? undefined,
  });

  const inquiryItems = useMemo(() => {
    if (!product) return [];
    return [
      {
        name: product.name,
        quantity: qty,
        price: parseFloat(String(product.price)),
        sku: product.sku,
      },
    ];
  }, [product, qty]);

  if (isLoading && !product) {
    return (
      <ShopLayout>
        <ProductDetailSkeleton />
      </ShopLayout>
    );
  }

  if (isError) {
    return (
      <ShopLayout>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="font-heading text-2xl font-semibold">Could not load product</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {humanizeError(error, { fallback: "Please try again." })}
          </p>
          <Link to="/shop" className="mt-4 inline-block text-sm text-primary underline">
            Back to shop
          </Link>
        </div>
      </ShopLayout>
    );
  }

  if (!product) {
    return (
      <ShopLayout>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="font-heading text-2xl font-semibold">Product not found</h1>
          <Link to="/shop" className="mt-4 inline-block text-sm text-primary underline">
            Back to shop
          </Link>
        </div>
      </ShopLayout>
    );
  }

  const images = sortProductImages(product.product_images ?? []);
  const active = images[activeImg];
  const stock = { available_stock: product.available_stock ?? product.stock_quantity };
  const out = !isInStock(stock);
  const maxQty = maxPurchasable(stock);
  const stockCopy = humanStockAvailability(maxQty);
  const shareImageUrls = images.map((img) => resolveProductImageUrl(img, "medium"));

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 pb-32 sm:px-6 md:pb-10">
        <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-primary">
            Shop
          </Link>
          {product.categories && (
            <>
              <span className="mx-2">/</span>
              <Link
                to="/shop"
                search={{ category: product.categorySlug ?? undefined }}
                className="hover:text-primary"
              >
                {product.categories.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-8 grid gap-12 md:grid-cols-2">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-md bg-secondary">
              <div className="absolute right-3 top-3 z-10">
                <WishlistButton productId={product.id} productName={product.name} />
              </div>
              {active ? (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="block h-full w-full cursor-zoom-in"
                  aria-label={`View full size image of ${product.name}`}
                >
                  <img
                    src={resolveProductImageUrl(active, "full")}
                    alt={productImageAlt(active, product.name)}
                    decoding="async"
                    width={1600}
                    height={1600}
                    className="h-full w-full object-cover"
                  />
                </button>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
                {images.map((img, i: number) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    aria-label={`View image ${i + 1}`}
                    aria-current={i === activeImg ? "true" : undefined}
                    className={`aspect-square w-16 shrink-0 overflow-hidden rounded-md border sm:w-auto ${i === activeImg ? "border-gold ring-2 ring-gold/40" : "border-border"}`}
                  >
                    <img
                      src={resolveProductImageUrl(img, "thumb")}
                      alt={productImageAlt(img, product.name)}
                      loading="lazy"
                      width={200}
                      height={200}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.categories && (
              <span className="text-xs font-medium uppercase tracking-[0.25em] text-gold">
                {product.categories.name}
              </span>
            )}
            <h1 className="mt-2 font-heading text-3xl font-semibold md:text-4xl">{product.name}</h1>
            <p className="mt-4 text-2xl font-semibold text-primary">{formatKES(product.price)}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span
                className={`rounded-full px-3 py-1 font-medium ${
                  stockCopy.tone === "out"
                    ? "bg-destructive/10 text-destructive"
                    : stockCopy.tone === "low"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-primary/10 text-primary"
                }`}
              >
                {stockCopy.label}
              </span>
              {product.sku && <span className="text-muted-foreground">SKU: {product.sku}</span>}
            </div>

            {product.description && (
              <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                {product.description}
              </p>
            )}

            {product.material && (
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-6 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Material
                  </dt>
                  <dd className="mt-1 text-foreground">{product.material}</dd>
                </div>
              </dl>
            )}

            <div className="mt-8 space-y-4 border-t pt-8">
              {!out && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Quantity</span>
                  <div className="inline-flex items-center rounded-md border">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="min-h-11 min-w-11 p-2 hover:bg-secondary"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                      className="min-h-11 min-w-11 p-2 hover:bg-secondary"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  disabled={out}
                  className="flex-1"
                  onClick={() => {
                    add(
                      {
                        productId: product.id,
                        name: product.name,
                        slug: product.slug,
                        price: parseFloat(String(product.price)),
                        image: images[0]?.medium_url ?? images[0]?.image_url ?? "",
                      },
                      qty,
                    );
                    toastAddedToCart(product.name);
                  }}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" /> Add to cart
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="flex-1 border-gold text-primary hover:bg-gold/10"
                  disabled={out}
                  onClick={() => setWaOpen(true)}
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> Order on WhatsApp
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
                onClick={() => setShareOpen(true)}
              >
                <Share2 className="mr-2 h-4 w-4" aria-hidden />
                Share this piece
              </Button>
            </div>
          </div>
        </div>

        <ProductImageLightbox
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          images={images}
          activeIndex={activeImg}
          onActiveIndexChange={setActiveImg}
          productName={product.name}
        />

        <ProductShareSheet
          open={shareOpen}
          onOpenChange={setShareOpen}
          payload={{
            name: product.name,
            slug: product.slug,
            price: parseFloat(String(product.price)),
            shopName,
            whatsapp,
            description: product.description ?? undefined,
            imageUrls: shareImageUrls,
          }}
        />

        <WhatsAppOrderBuilderSheet
          open={waOpen}
          onOpenChange={setWaOpen}
          items={inquiryItems}
          shopName={shopName}
          whatsapp={whatsapp}
        />

        <MobileStickyBar aboveTabBar>
          <div className="mx-auto flex max-w-7xl items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="text-lg font-semibold text-primary">{formatKES(product.price)}</p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="shrink-0 border-gold text-primary"
              disabled={out}
              aria-label="Order on WhatsApp"
              onClick={() => setWaOpen(true)}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              disabled={out}
              className="shrink-0"
              onClick={() => {
                add(
                  {
                    productId: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: parseFloat(String(product.price)),
                    image: images[0]?.medium_url ?? images[0]?.image_url ?? "",
                  },
                  qty,
                );
                toastAddedToCart(product.name);
              }}
            >
              <ShoppingBag className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
        </MobileStickyBar>
      </div>
    </ShopLayout>
  );
}
