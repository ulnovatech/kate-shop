/**
 * Chunk A1 — white-label store branding from `settings` with dev fallbacks only.
 */

/** Dev / unset fallbacks — not used when settings row has values. */
export const FALLBACK_SHOP_NAME = "Store";
export const FALLBACK_TAGLINE = "Online shop";
export const FALLBACK_DESCRIPTION =
  "Shop online with delivery. Order via WhatsApp or checkout on the web.";
export const FALLBACK_PHONE = "0770486217";
export const FALLBACK_WHATSAPP = "256770486217";
export const FALLBACK_EMAIL = "hello@example.com";
export const FALLBACK_ADDRESS = "Kampala, Uganda";

export const STORE_BRANDING_QUERY_KEY = ["store-branding"] as const;

export type StoreBranding = {
  shopName: string;
  tagline: string;
  metaTitle: string | null;
  metaDescription: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  logoUrl: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  aboutText: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
};

export type SettingsBrandingRow = {
  shop_name?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  logo_url?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  about_text?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
};

export function brandingFromSettings(row: SettingsBrandingRow | null | undefined): StoreBranding {
  const shopName = row?.shop_name?.trim() || FALLBACK_SHOP_NAME;
  const heroSubtitle = row?.hero_subtitle?.trim() || null;

  return {
    shopName,
    tagline: heroSubtitle || FALLBACK_TAGLINE,
    metaTitle: row?.meta_title?.trim() || null,
    metaDescription: row?.meta_description?.trim() || null,
    phone: row?.phone?.trim() || FALLBACK_PHONE,
    whatsapp: row?.whatsapp?.trim() || FALLBACK_WHATSAPP,
    email: row?.email?.trim() || FALLBACK_EMAIL,
    address: row?.address?.trim() || FALLBACK_ADDRESS,
    logoUrl: row?.logo_url?.trim() || null,
    heroTitle: row?.hero_title?.trim() || null,
    heroSubtitle,
    aboutText: row?.about_text?.trim() || null,
    instagram: row?.instagram?.trim() || null,
    tiktok: row?.tiktok?.trim() || null,
    facebook: row?.facebook?.trim() || null,
  };
}

export function footerTagline(branding: StoreBranding): string {
  return (
    branding.aboutText ||
    branding.metaDescription ||
    branding.heroSubtitle ||
    `${branding.shopName} — ${branding.tagline}`
  );
}

export function contactPageDescription(branding: StoreBranding): string {
  return `Contact ${branding.shopName} — WhatsApp, phone, email, and delivery.`;
}
