import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { loadStoreBranding } from "@kate/api/branding.server";
import {
  absoluteUrl,
  buildRobotsTxt,
  buildSitemapXml,
  defaultSiteDescription,
  defaultSiteTitle,
  getSiteOrigin,
} from "@/lib/seo";
import { isInStock } from "@/lib/inventory";
import { primaryProductImage, resolveProductImageUrl } from "@/lib/shop";
import { contactPageDescription } from "@/lib/store-branding";

export const getHomeSeo = createServerFn({ method: "GET" }).handler(async () => {
  const branding = await loadStoreBranding();

  return {
    branding,
    title: branding.metaTitle || defaultSiteTitle(undefined, branding),
    description:
      branding.metaDescription || branding.heroSubtitle || defaultSiteDescription(branding),
  };
});

export const getSiteSeoDefaults = createServerFn({ method: "GET" }).handler(async () => {
  const branding = await loadStoreBranding();
  return {
    branding,
    title: branding.metaTitle || defaultSiteTitle(undefined, branding),
    description: defaultSiteDescription(branding),
    contactDescription: contactPageDescription(branding),
  };
});

const categorySlugSchema = z.object({ slug: z.string().min(1) });

export const getCategorySeo = createServerFn({ method: "GET" })
  .inputValidator(categorySlugSchema)
  .handler(async ({ data }) => {
    const branding = await loadStoreBranding();

    const { data: cat, error } = await supabaseAdmin
      .from("categories")
      .select("name, slug, meta_title, meta_description")
      .eq("slug", data.slug)
      .eq("is_hidden", false)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!cat) return null;

    return {
      name: cat.name,
      slug: cat.slug,
      branding,
      title: cat.meta_title?.trim() || defaultSiteTitle(cat.name, branding),
      description: cat.meta_description?.trim() || `Shop ${cat.name} at ${branding.shopName}.`,
    };
  });

const productSlugSchema = z.object({ slug: z.string().min(1) });

export const getProductPageData = createServerFn({ method: "GET" })
  .inputValidator(productSlugSchema)
  .handler(async ({ data }) => {
    const branding = await loadStoreBranding();

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select(
        "*, product_images(id, image_url, thumbnail_url, medium_url, full_url, sort_order, is_primary, alt_text), categories(name, slug)",
      )
      .eq("slug", data.slug)
      .eq("is_visible", true)
      .eq("is_active", true)
      .is("archived_at", null)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!product) return null;

    const img = primaryProductImage(product.product_images ?? []);
    const imageUrl = img ? resolveProductImageUrl(img, "full") : null;
    const price = Number(product.price);
    const stock = { available_stock: product.available_stock ?? product.stock_quantity };

    return {
      ...product,
      branding,
      seoTitle: product.meta_title?.trim() || defaultSiteTitle(product.name, branding),
      seoDescription:
        product.meta_description?.trim() ||
        (product.description
          ? String(product.description).slice(0, 320)
          : `${product.name} — available at ${branding.shopName}.`),
      imageUrl,
      price,
      inStock: isInStock(stock),
      categoryName: (product.categories as { name: string } | null)?.name ?? null,
      categorySlug: (product.categories as { slug: string } | null)?.slug ?? null,
    };
  });

export const getSitemapXml = createServerFn({ method: "GET" }).handler(async () => {
  const origin = getSiteOrigin();
  const now = new Date().toISOString().slice(0, 10);

  const staticPages = [
    { path: "/", priority: "1.0", changefreq: "weekly" },
    { path: "/shop", priority: "0.9", changefreq: "daily" },
    { path: "/contact", priority: "0.6", changefreq: "monthly" },
  ];

  const { data: categories } = await supabaseAdmin
    .from("categories")
    .select("slug, created_at")
    .eq("is_hidden", false)
    .is("deleted_at", null);

  const { data: products } = await supabaseAdmin
    .from("products")
    .select("slug, updated_at")
    .eq("is_visible", true)
    .eq("is_active", true)
    .is("archived_at", null)
    .is("deleted_at", null);

  const urls = [
    ...staticPages.map((p) => ({
      loc: absoluteUrl(p.path),
      lastmod: now,
      changefreq: p.changefreq,
      priority: p.priority,
    })),
    ...(categories ?? []).map((c) => ({
      loc: absoluteUrl(`/shop?category=${encodeURIComponent(c.slug)}`),
      lastmod: c.created_at?.slice(0, 10) ?? now,
      changefreq: "weekly",
      priority: "0.8",
    })),
    ...(products ?? []).map((p) => ({
      loc: absoluteUrl(`/product/${p.slug}`),
      lastmod: p.updated_at?.slice(0, 10) ?? now,
      changefreq: "weekly",
      priority: "0.7",
    })),
  ];

  return buildSitemapXml(urls);
});

export const getRobotsTxt = createServerFn({ method: "GET" }).handler(async () => {
  return buildRobotsTxt(getSiteOrigin());
});
