import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { requireCatalogAuth } from "@kate/api/auth-middleware.server";
import { auditFromServer } from "@kate/api/audit.server";
import { pickCategoryAuditFields, pickProductAuditFields } from "@/lib/audit";
import type { RecycleItem } from "@/lib/recycle";

const entitySchema = z.object({
  entity_type: z.enum(["product", "category"]),
  id: z.string().uuid(),
});

function storagePaths(img: {
  image_url?: string | null;
  thumbnail_url?: string | null;
  medium_url?: string | null;
  full_url?: string | null;
}): string[] {
  return [
    ...new Set(
      [img.thumbnail_url, img.medium_url, img.full_url, img.image_url].filter(
        (p): p is string => !!p && !p.startsWith("http"),
      ),
    ),
  ];
}

export const listRecycleBin = createServerFn({ method: "GET" })
  .middleware([requireCatalogAuth])
  .handler(async () => {
    const [{ data: products, error: pErr }, { data: categories, error: cErr }] = await Promise.all([
      supabaseAdmin
        .from("products")
        .select("id, name, slug, deleted_at, deleted_by, sku")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("categories")
        .select("id, name, slug, deleted_at, deleted_by")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(100),
    ]);

    if (pErr) throw new Error(pErr.message);
    if (cErr) throw new Error(cErr.message);

    const items: RecycleItem[] = [
      ...(products ?? []).map(
        (p): RecycleItem => ({
          entity_type: "product",
          id: p.id,
          name: p.name,
          slug: p.slug,
          deleted_at: p.deleted_at!,
          deleted_by: p.deleted_by,
          meta: p.sku ? `SKU: ${p.sku}` : null,
        }),
      ),
      ...(categories ?? []).map(
        (c): RecycleItem => ({
          entity_type: "category",
          id: c.id,
          name: c.name,
          slug: c.slug,
          deleted_at: c.deleted_at!,
          deleted_by: c.deleted_by,
        }),
      ),
    ];

    items.sort((a, b) => b.deleted_at.localeCompare(a.deleted_at));
    return items;
  });

export const moveToRecycle = createServerFn({ method: "POST" })
  .middleware([requireCatalogAuth])
  .inputValidator(entitySchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as { userId: string; permissionKeys: Set<string> };
    if (!auth.permissionKeys.has("catalog.delete")) {
      throw new Error("Forbidden: catalog.delete required");
    }
    const now = new Date().toISOString();

    if (data.entity_type === "product") {
      const { data: before, error: loadErr } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (loadErr) throw new Error(loadErr.message);
      if (!before) throw new Error("Product not found");
      if (before.deleted_at) throw new Error("Product is already in the recycle bin");

      const { error } = await supabaseAdmin
        .from("products")
        .update({
          deleted_at: now,
          deleted_by: auth.userId,
          is_visible: false,
          is_active: false,
          updated_at: now,
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);

      await auditFromServer(
        auth.userId,
        "product_deleted",
        "product",
        data.id,
        pickProductAuditFields(before as Record<string, unknown>),
        pickProductAuditFields({
          ...(before as Record<string, unknown>),
          deleted_at: now,
          is_visible: false,
          is_active: false,
        }),
        { via: "recycle_bin" },
      );
      return { ok: true };
    }

    const { data: before, error: loadErr } = await supabaseAdmin
      .from("categories")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (loadErr) throw new Error(loadErr.message);
    if (!before) throw new Error("Category not found");
    if (before.deleted_at) throw new Error("Category is already in the recycle bin");

    const { count } = await supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", data.id)
      .is("deleted_at", null);
    if ((count ?? 0) > 0) {
      throw new Error(
        "Category has active products. Reassign them first or move those products to recycle.",
      );
    }

    const { error } = await supabaseAdmin
      .from("categories")
      .update({
        deleted_at: now,
        deleted_by: auth.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await auditFromServer(
      auth.userId,
      "category_deleted",
      "category",
      data.id,
      pickCategoryAuditFields(before as Record<string, unknown>),
      pickCategoryAuditFields({ ...(before as Record<string, unknown>), deleted_at: now }),
      { via: "recycle_bin" },
    );
    return { ok: true };
  });

export const restoreFromRecycle = createServerFn({ method: "POST" })
  .middleware([requireCatalogAuth])
  .inputValidator(entitySchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as { userId: string };

    if (data.entity_type === "product") {
      const { data: before, error: loadErr } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (loadErr) throw new Error(loadErr.message);
      if (!before?.deleted_at) throw new Error("Product is not in the recycle bin");

      const { error } = await supabaseAdmin
        .from("products")
        .update({
          deleted_at: null,
          deleted_by: null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);

      await auditFromServer(
        auth.userId,
        "item_restored",
        "product",
        data.id,
        pickProductAuditFields(before as Record<string, unknown>),
        pickProductAuditFields({
          ...(before as Record<string, unknown>),
          deleted_at: null,
          is_active: true,
        }),
      );
      return { ok: true };
    }

    const { data: before, error: loadErr } = await supabaseAdmin
      .from("categories")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (loadErr) throw new Error(loadErr.message);
    if (!before?.deleted_at) throw new Error("Category is not in the recycle bin");

    const { error } = await supabaseAdmin
      .from("categories")
      .update({ deleted_at: null, deleted_by: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await auditFromServer(
      auth.userId,
      "item_restored",
      "category",
      data.id,
      pickCategoryAuditFields(before as Record<string, unknown>),
      pickCategoryAuditFields({ ...(before as Record<string, unknown>), deleted_at: null }),
    );
    return { ok: true };
  });

export const purgeFromRecycle = createServerFn({ method: "POST" })
  .middleware([requireCatalogAuth])
  .inputValidator(entitySchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as { userId: string; permissionKeys: Set<string> };
    if (!auth.permissionKeys.has("catalog.delete")) {
      throw new Error("Forbidden: catalog.delete required");
    }

    if (data.entity_type === "product") {
      const { data: product, error: loadErr } = await supabaseAdmin
        .from("products")
        .select("*, product_images(image_url, thumbnail_url, medium_url, full_url)")
        .eq("id", data.id)
        .maybeSingle();
      if (loadErr) throw new Error(loadErr.message);
      if (!product?.deleted_at)
        throw new Error("Product must be in the recycle bin before permanent delete");

      const paths = (product.product_images ?? []).flatMap((img) =>
        storagePaths(img as Record<string, string | null>),
      );
      if (paths.length) {
        await supabaseAdmin.storage.from("product-images").remove(paths);
      }

      const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
      if (error) throw new Error(error.message);

      await auditFromServer(
        auth.userId,
        "item_purged",
        "product",
        data.id,
        pickProductAuditFields(product as Record<string, unknown>),
        null,
      );
      return { ok: true };
    }

    const { data: category, error: loadErr } = await supabaseAdmin
      .from("categories")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (loadErr) throw new Error(loadErr.message);
    if (!category?.deleted_at)
      throw new Error("Category must be in the recycle bin before permanent delete");

    const { count } = await supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", data.id);
    if ((count ?? 0) > 0) {
      throw new Error("Category still has products assigned. Purge or reassign them first.");
    }

    const { error } = await supabaseAdmin.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);

    await auditFromServer(
      auth.userId,
      "item_purged",
      "category",
      data.id,
      pickCategoryAuditFields(category as Record<string, unknown>),
      null,
    );
    return { ok: true };
  });
