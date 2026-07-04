import { supabase } from "@/integrations/supabase/client";
import { ensureUniqueProductSlug, ensureUniqueProductSku } from "@/lib/catalog";
import { recordAudit } from "@/lib/api/audit.functions";
import { pickProductAuditFields } from "@/lib/audit";
import type { ProductWizardFormData } from "./product-wizard-schema";
import type { ExistingProductRecord, ProductWizardImage } from "./types";

export type PersistProductWizardResult = {
  id: string;
  slug: string;
};

export async function persistProductWizard({
  productId,
  values,
  images,
  existing,
}: {
  productId?: string;
  values: ProductWizardFormData;
  images: ProductWizardImage[];
  existing?: ExistingProductRecord | null;
}): Promise<PersistProductWizardResult> {
  const now = new Date().toISOString();
  const stock = values.stock_quantity;
  const reserved = existing?.reserved_stock ?? 0;
  const available = Math.max(0, stock - reserved);
  const defaultAlt = values.name.trim();
  let id = productId;
  let slug = existing?.slug ?? "";
  let resolvedSku = values.sku?.trim() || existing?.sku?.trim() || "";
  if (!resolvedSku) {
    resolvedSku = await ensureUniqueProductSku(values.name, productId);
  }

  if (productId) {
    const { error } = await supabase
      .from("products")
      .update({
        name: values.name,
        description: values.description ?? "",
        material: values.material ?? "",
        category_id: values.category_id || null,
        price: values.price,
        sku: resolvedSku,
        stock_quantity: stock,
        available_stock: available,
        low_stock_threshold: values.low_stock_threshold,
        is_visible: values.is_visible,
        is_featured: values.is_featured,
        meta_title: values.meta_title || null,
        meta_description: values.meta_description || null,
        updated_at: now,
      })
      .eq("id", productId);
    if (error) throw error;
  } else {
    slug = await ensureUniqueProductSlug(values.name);
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: values.name,
        slug,
        description: values.description ?? "",
        material: values.material ?? "",
        category_id: values.category_id || null,
        price: values.price,
        sku: resolvedSku,
        stock_quantity: stock,
        available_stock: stock,
        reserved_stock: 0,
        low_stock_threshold: values.low_stock_threshold,
        is_visible: values.is_visible,
        is_featured: values.is_featured,
        meta_title: values.meta_title || null,
        meta_description: values.meta_description || null,
      })
      .select()
      .single();
    if (error) throw error;
    id = data.id;
  }

  const newOnes = images.filter((i) => i.isNew);
  if (newOnes.length) {
    const { error: imgErr } = await supabase.from("product_images").insert(
      newOnes.map((i) => ({
        product_id: id!,
        image_url: i.image_url,
        thumbnail_url: i.thumbnail_url ?? i.image_url,
        medium_url: i.medium_url ?? i.image_url,
        full_url: i.full_url ?? i.image_url,
        sort_order: i.sort_order,
        is_primary: i.sort_order === 0,
        alt_text: i.alt_text.trim() || defaultAlt,
      })),
    );
    if (imgErr) throw imgErr;
  }

  for (const i of images.filter((x) => x.id)) {
    const { error: updErr } = await supabase
      .from("product_images")
      .update({
        sort_order: i.sort_order,
        is_primary: i.sort_order === 0,
        alt_text: i.alt_text.trim() || defaultAlt,
      })
      .eq("id", i.id!);
    if (updErr) throw updErr;
  }

  const afterSnapshot = pickProductAuditFields({
    id: id!,
    name: values.name,
    sku: resolvedSku,
    price: values.price,
    stock_quantity: stock,
    available_stock: available,
    is_visible: values.is_visible,
    is_featured: values.is_featured,
    category_id: values.category_id ?? null,
  });

  const beforeSnapshot = existing
    ? pickProductAuditFields(existing as Record<string, unknown>)
    : null;
  const stockChanged =
    existing != null && Number(existing.stock_quantity) !== Number(values.stock_quantity);

  void recordAudit({
    data: {
      action: productId
        ? stockChanged
          ? "inventory_changed"
          : "product_updated"
        : "product_created",
      entity_type: stockChanged && productId ? "inventory" : "product",
      entity_id: id!,
      before: beforeSnapshot,
      after: afterSnapshot,
    },
  });

  return { id: id!, slug };
}
