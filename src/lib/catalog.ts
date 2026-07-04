import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/shop";

export type ProductListFilter = "active" | "archived" | "all";

export async function ensureUniqueProductSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "product";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    let qb = supabase.from("products").select("id").eq("slug", candidate);
    if (excludeId) qb = qb.neq("id", excludeId);
    const { data } = await qb.maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Auto SKU for new products when staff does not enter one manually. */
export async function ensureUniqueProductSku(name?: string, excludeId?: string): Promise<string> {
  const base =
    slugify(name ?? "")
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase() || "ITEM";
  for (let i = 0; i < 50; i++) {
    const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
    const candidate = i === 0 ? `${base}-${suffix}` : `${base}-${suffix}${i}`;
    let qb = supabase.from("products").select("id").eq("sku", candidate);
    if (excludeId) qb = qb.neq("id", excludeId);
    const { data } = await qb.maybeSingle();
    if (!data) return candidate;
  }
  return `ITEM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function ensureUniqueCategorySlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "category";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    let qb = supabase.from("categories").select("id").eq("slug", candidate);
    if (excludeId) qb = qb.neq("id", excludeId);
    const { data } = await qb.maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export function isLowStock(available: number, threshold: number): boolean {
  return available > 0 && available <= threshold;
}

export function stockLabel(available: number, threshold: number): string {
  if (available <= 0) return "Out of stock";
  if (isLowStock(available, threshold)) return "Low stock";
  return "In stock";
}

/** Copy product + image rows; new product starts hidden with a fresh slug. */
export async function duplicateProduct(productId: string): Promise<string> {
  const { data: src, error: fetchErr } = await supabase
    .from("products")
    .select(
      "*, product_images(image_url, thumbnail_url, medium_url, full_url, sort_order, alt_text, is_primary)",
    )
    .eq("id", productId)
    .single();
  if (fetchErr || !src) throw fetchErr ?? new Error("Product not found");

  const copyName = `${src.name} (copy)`;
  const slug = await ensureUniqueProductSlug(copyName);
  const stock = src.stock_quantity ?? 0;

  const { data: created, error: insertErr } = await supabase
    .from("products")
    .insert({
      name: copyName,
      slug,
      description: src.description ?? "",
      material: src.material ?? "",
      category_id: src.category_id,
      price: src.price,
      sku: src.sku ? `${src.sku}-copy` : "",
      stock_quantity: stock,
      available_stock: stock,
      reserved_stock: 0,
      low_stock_threshold: src.low_stock_threshold ?? 5,
      is_visible: false,
      is_featured: false,
      is_active: true,
      meta_title: src.meta_title,
      meta_description: src.meta_description,
    })
    .select("id")
    .single();
  if (insertErr || !created) throw insertErr ?? new Error("Could not duplicate product");

  const images = (src.product_images ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order,
  );
  if (images.length) {
    const { error: imgErr } = await supabase.from("product_images").insert(
      images.map(
        (
          img: {
            image_url: string;
            thumbnail_url?: string | null;
            medium_url?: string | null;
            full_url?: string | null;
            sort_order: number;
            alt_text?: string;
            is_primary?: boolean;
          },
          i: number,
        ) => ({
          product_id: created.id,
          image_url: img.image_url,
          thumbnail_url: img.thumbnail_url ?? img.image_url,
          medium_url: img.medium_url ?? img.image_url,
          full_url: img.full_url ?? img.image_url,
          sort_order: img.sort_order ?? i,
          alt_text: img.alt_text ?? "",
          is_primary: i === 0,
        }),
      ),
    );
    if (imgErr) throw imgErr;
  }

  return created.id;
}
