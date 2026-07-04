import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";
import type { ProductCardData } from "@/components/product-card";

const productSelect =
  "id, name, slug, price, stock_quantity, available_stock, product_images(id, image_url, thumbnail_url, medium_url, full_url, sort_order, is_primary, alt_text)";

const customerIdSchema = z.object({ customerId: z.string().uuid() });

async function assertCustomer(customerId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Customer not found");
}

export const listWishlist = createServerFn({ method: "POST" })
  .inputValidator(customerIdSchema)
  .handler(async ({ data }) => {
    await assertCustomer(data.customerId);

    const { data: items, error } = await supabaseAdmin
      .from("wishlist_items")
      .select(`product_id, products(${productSelect})`)
      .eq("customer_id", data.customerId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (items ?? [])
      .map((row) => {
        const p = row.products as ProductCardData | null;
        return p ? { productId: row.product_id, product: p } : null;
      })
      .filter(Boolean) as { productId: string; product: ProductCardData }[];
  });

const toggleSchema = z.object({
  customerId: z.string().uuid(),
  productId: z.string().uuid(),
});

export const toggleWishlistItem = createServerFn({ method: "POST" })
  .inputValidator(toggleSchema)
  .handler(async ({ data }) => {
    await assertCustomer(data.customerId);

    const { data: existing } = await supabaseAdmin
      .from("wishlist_items")
      .select("id")
      .eq("customer_id", data.customerId)
      .eq("product_id", data.productId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin.from("wishlist_items").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { saved: false };
    }

    const { error } = await supabaseAdmin.from("wishlist_items").insert({
      customer_id: data.customerId,
      product_id: data.productId,
    });
    if (error) throw new Error(error.message);
    return { saved: true };
  });

const syncSchema = z.object({
  customerId: z.string().uuid(),
  productIds: z.array(z.string().uuid()).max(100),
});

export const syncWishlistItems = createServerFn({ method: "POST" })
  .inputValidator(syncSchema)
  .handler(async ({ data }) => {
    await assertCustomer(data.customerId);
    const unique = [...new Set(data.productIds)];
    if (!unique.length) return { synced: 0 };

    const rows = unique.map((productId) => ({
      customer_id: data.customerId,
      product_id: productId,
    }));

    const { error } = await supabaseAdmin.from("wishlist_items").upsert(rows, {
      onConflict: "customer_id,product_id",
      ignoreDuplicates: true,
    });

    if (error) throw new Error(error.message);
    return { synced: unique.length };
  });
