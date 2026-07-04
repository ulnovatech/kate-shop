import { supabase } from "@/integrations/supabase/client";
import type { ImageVariant } from "@/lib/media";
import { FALLBACK_WHATSAPP } from "@/lib/store-branding";

/** @deprecated Use `useStoreBranding().whatsapp` or fallbacks from store-branding.ts */
export const WHATSAPP_NUMBER = FALLBACK_WHATSAPP;

/** @deprecated Use `useStoreBranding()` — dev fallback only */
export { FALLBACK_SHOP_NAME as SHOP_NAME } from "@/lib/store-branding";
/** @deprecated Use `useStoreBranding()` — dev fallback only */
export { FALLBACK_PHONE as DEFAULT_PHONE } from "@/lib/store-branding";
/** @deprecated Use `useStoreBranding()` — dev fallback only */
export { FALLBACK_EMAIL as DEFAULT_EMAIL } from "@/lib/store-branding";
/** @deprecated Use `useStoreBranding()` — dev fallback only */
export { FALLBACK_ADDRESS as DEFAULT_ADDRESS } from "@/lib/store-branding";

/** Supabase select fragment for product_images queries. */
export const PRODUCT_IMAGE_SELECT =
  "id, image_url, thumbnail_url, medium_url, full_url, sort_order, is_primary, alt_text";

export type ProductImageFields = {
  image_url: string;
  sort_order?: number;
  is_primary?: boolean;
  alt_text?: string | null;
  thumbnail_url?: string | null;
  medium_url?: string | null;
  full_url?: string | null;
};

export function formatUGX(n: number | string) {
  const v = typeof n === "string" ? parseFloat(n) : n;
  const num = isNaN(v) ? 0 : v;
  return `UGX ${new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(num)}`;
}

/** @deprecated Use formatUGX */
export const formatKES = formatUGX;

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function whatsappUrl(message: string, phone: string = WHATSAPP_NUMBER) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function productImageUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

/** Resolve variant URL with legacy single-path fallback. */
export function resolveProductImageUrl(
  img: ProductImageFields | string | null | undefined,
  variant: ImageVariant = "medium",
): string {
  if (!img) return "";
  if (typeof img === "string") return productImageUrl(img);

  const path =
    variant === "thumb"
      ? (img.thumbnail_url ?? img.image_url)
      : variant === "full"
        ? (img.full_url ?? img.image_url)
        : (img.medium_url ?? img.image_url);

  return path ? productImageUrl(path) : "";
}

export function sortProductImages<T extends { sort_order: number; is_primary?: boolean }>(
  images: T[],
): T[] {
  return [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  });
}

export function primaryProductImage<T extends ProductImageFields>(
  images: T[] | null | undefined,
): T | undefined {
  if (!images?.length) return undefined;
  return sortProductImages(images)[0];
}

export function productImageAlt(img: ProductImageFields | undefined, fallback: string): string {
  const alt = img?.alt_text?.trim();
  return alt || fallback;
}
