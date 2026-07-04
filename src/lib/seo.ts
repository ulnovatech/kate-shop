import {
  FALLBACK_DESCRIPTION,
  FALLBACK_SHOP_NAME,
  FALLBACK_TAGLINE,
  type StoreBranding,
} from "@/lib/store-branding";

/** Public site origin for canonical URLs, sitemap, and Open Graph. */
export function getSiteOrigin(): string {
  const fromEnv =
    (typeof process !== "undefined" && process.env.APP_ORIGIN) ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL);
  if (fromEnv && typeof fromEnv === "string") {
    return fromEnv.replace(/\/$/, "");
  }
  return "http://localhost:8080";
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteOrigin()}${normalized}`;
}

export function truncateMeta(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "product";
  noIndex?: boolean;
};

export function buildPageHead(input: PageMetaInput) {
  const url = absoluteUrl(input.path);
  const description = truncateMeta(input.description, 320);
  const title = truncateMeta(input.title, 70);
  const image = input.image?.startsWith("http")
    ? input.image
    : input.image
      ? absoluteUrl(input.image)
      : undefined;

  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: input.type ?? "website" },
    { property: "og:url", content: url },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];

  if (image) {
    meta.push({ property: "og:image", content: image }, { name: "twitter:image", content: image });
  }

  if (input.noIndex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  return {
    meta,
    links: [{ rel: "canonical", href: url }],
  };
}

export function defaultSiteTitle(
  suffix?: string,
  branding?: Pick<StoreBranding, "shopName" | "tagline">,
): string {
  const name = branding?.shopName ?? FALLBACK_SHOP_NAME;
  const tagline = branding?.tagline ?? FALLBACK_TAGLINE;
  return suffix ? `${suffix} · ${name}` : `${name} — ${tagline}`;
}

export function defaultSiteDescription(
  branding?: Pick<StoreBranding, "metaDescription" | "heroSubtitle" | "shopName">,
): string {
  if (branding?.metaDescription) return branding.metaDescription;
  if (branding?.heroSubtitle) return branding.heroSubtitle;
  if (branding?.shopName) return `${branding.shopName} — ${FALLBACK_DESCRIPTION}`;
  return FALLBACK_DESCRIPTION;
}

export type ProductJsonLdInput = {
  name: string;
  description?: string | null;
  slug: string;
  price: number;
  sku?: string | null;
  imageUrl?: string | null;
  inStock: boolean;
  categoryName?: string | null;
};

export function buildProductJsonLd(
  product: ProductJsonLdInput,
  branding?: Pick<StoreBranding, "shopName">,
): Record<string, unknown> {
  const url = absoluteUrl(`/product/${product.slug}`);
  const brandName = branding?.shopName ?? FALLBACK_SHOP_NAME;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    sku: product.sku || undefined,
    image: product.imageUrl || undefined,
    url,
    brand: { "@type": "Brand", name: brandName },
    category: product.categoryName || undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "UGX",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function jsonLdScript(data: Record<string, unknown> | Record<string, unknown>[]) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(data),
  };
}

export function buildSitemapXml(
  urls: { loc: string; lastmod?: string; changefreq?: string; priority?: string }[],
): string {
  const entries = urls
    .map((u) => {
      const parts = [`    <url>`, `      <loc>${escapeXml(u.loc)}</loc>`];
      if (u.lastmod) parts.push(`      <lastmod>${u.lastmod}</lastmod>`);
      if (u.changefreq) parts.push(`      <changefreq>${u.changefreq}</changefreq>`);
      if (u.priority) parts.push(`      <priority>${u.priority}</priority>`);
      parts.push(`    </url>`);
      return parts.join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

export function buildRobotsTxt(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /checkout
Disallow: /cart

Sitemap: ${base}/sitemap.xml
`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
