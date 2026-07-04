import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { duplicateProduct } from "@/lib/catalog";
import { recordAudit } from "@/lib/api/audit.functions";
import { moveToRecycle } from "@/lib/api/recycle.functions";
import { pickProductAuditFields } from "@/lib/audit";
import { humanizeError } from "@/lib/errors";
import { adminProductEditTarget } from "@/lib/admin-routes";
import { ADMIN_SETUP_COMPLETION_QUERY_KEY } from "@/lib/admin-setup-completion";
import type { AdminProduct } from "./types";

export function useProductListMutations() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-products"] });
    void qc.invalidateQueries({ queryKey: ADMIN_SETUP_COMPLETION_QUERY_KEY });
  };

  const snapshotProducts = async () => {
    await qc.cancelQueries({ queryKey: ["admin-products"] });
    return qc.getQueriesData({ queryKey: ["admin-products"] });
  };

  const restoreProducts = (previous: [unknown, unknown][]) => {
    previous.forEach(([key, data]) => qc.setQueryData(key, data));
  };

  const updateProductsCache = (id: string, patch: Record<string, unknown>) => {
    qc.setQueriesData({ queryKey: ["admin-products"] }, (old: unknown) => {
      if (!Array.isArray(old)) return old;
      return old.map((p) =>
        p && typeof p === "object" && "id" in p && p.id === id ? { ...p, ...patch } : p,
      );
    });
  };

  const updateManyProductsCache = (ids: string[], patch: Record<string, unknown>) => {
    const idSet = new Set(ids);
    qc.setQueriesData({ queryKey: ["admin-products"] }, (old: unknown) => {
      if (!Array.isArray(old)) return old;
      return old.map((p) =>
        p && typeof p === "object" && "id" in p && idSet.has(String(p.id)) ? { ...p, ...patch } : p,
      );
    });
  };

  const removeProductsFromCache = (ids: string[]) => {
    const idSet = new Set(ids);
    qc.setQueriesData({ queryKey: ["admin-products"] }, (old: unknown) => {
      if (!Array.isArray(old)) return old;
      return old.filter(
        (p) => !(p && typeof p === "object" && "id" in p && idSet.has(String(p.id))),
      );
    });
  };

  const auditProductChange = (
    product: Record<string, unknown>,
    action: "product_updated" | "product_deleted",
    after?: Record<string, unknown> | null,
  ) => {
    void recordAudit({
      data: {
        action,
        entity_type: "product",
        entity_id: String(product.id),
        before: pickProductAuditFields(product),
        after: after ? pickProductAuditFields(after) : null,
      },
    });
  };

  const toggleVisible = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_visible: val, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, val }) => {
      const previous = await snapshotProducts();
      updateProductsCache(id, { is_visible: val });
      return { previous };
    },
    onError: (e, _vars, context) => {
      if (context?.previous) restoreProducts(context.previous);
      toast.error(humanizeError(e, { fallback: "Could not update visibility." }));
    },
    onSettled: () => invalidate(),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_featured: val, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, val }) => {
      const previous = await snapshotProducts();
      updateProductsCache(id, { is_featured: val });
      return { previous };
    },
    onError: (e, _vars, context) => {
      if (context?.previous) restoreProducts(context.previous);
      toast.error(humanizeError(e, { fallback: "Could not update featured status." }));
    },
    onSuccess: () => toast.success("Featured updated"),
    onSettled: () => invalidate(),
  });

  const archive = useMutation({
    mutationFn: async (product: AdminProduct) => {
      const archivedAt = new Date().toISOString();
      const { error } = await supabase
        .from("products")
        .update({
          archived_at: archivedAt,
          is_visible: false,
          updated_at: archivedAt,
        })
        .eq("id", product.id);
      if (error) throw error;
      auditProductChange(product, "product_updated", {
        ...product,
        archived_at: archivedAt,
        is_visible: false,
      });
    },
    onMutate: async (product) => {
      const previous = await snapshotProducts();
      const archivedAt = new Date().toISOString();
      updateProductsCache(product.id, {
        archived_at: archivedAt,
        is_visible: false,
      });
      return { previous };
    },
    onError: (e, _vars, context) => {
      if (context?.previous) restoreProducts(context.previous);
      toast.error(humanizeError(e, { fallback: "Could not archive product." }));
    },
    onSuccess: () => toast.success("Product archived"),
    onSettled: () => invalidate(),
  });

  const restore = useMutation({
    mutationFn: async (product: AdminProduct) => {
      const { error } = await supabase
        .from("products")
        .update({
          archived_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);
      if (error) throw error;
      auditProductChange(product, "product_updated", { ...product, archived_at: null });
    },
    onMutate: async (product) => {
      const previous = await snapshotProducts();
      updateProductsCache(product.id, { archived_at: null });
      return { previous };
    },
    onError: (e, _vars, context) => {
      if (context?.previous) restoreProducts(context.previous);
      toast.error(humanizeError(e, { fallback: "Could not restore product." }));
    },
    onSuccess: () => toast.success("Product restored"),
    onSettled: () => invalidate(),
  });

  const softDelete = useMutation({
    mutationFn: async (id: string) => moveToRecycle({ data: { entity_type: "product", id } }),
    onMutate: async (id) => {
      const previous = await snapshotProducts();
      removeProductsFromCache([id]);
      return { previous };
    },
    onError: (e, _vars, context) => {
      if (context?.previous) restoreProducts(context.previous);
      toast.error(humanizeError(e, { fallback: "Could not delete product." }));
    },
    onSuccess: () => {
      toast.success("Moved to recently deleted");
      void qc.invalidateQueries({ queryKey: ["admin-recycle"] });
    },
    onSettled: () => invalidate(),
  });

  const bulkPublish = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("products")
        .update({ is_visible: true, updated_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
    },
    onMutate: async (ids) => {
      const previous = await snapshotProducts();
      updateManyProductsCache(ids, { is_visible: true });
      return { previous };
    },
    onError: (e, _vars, context) => {
      if (context?.previous) restoreProducts(context.previous);
      toast.error(humanizeError(e, { fallback: "Could not publish products." }));
    },
    onSuccess: (_data, ids) =>
      toast.success(`Published ${ids.length} product${ids.length === 1 ? "" : "s"}`),
    onSettled: () => invalidate(),
  });

  const bulkArchive = useMutation({
    mutationFn: async (products: AdminProduct[]) => {
      const archivedAt = new Date().toISOString();
      const ids = products.map((p) => p.id);
      const { error } = await supabase
        .from("products")
        .update({
          archived_at: archivedAt,
          is_visible: false,
          updated_at: archivedAt,
        })
        .in("id", ids);
      if (error) throw error;
      products.forEach((product) =>
        auditProductChange(product, "product_updated", {
          ...product,
          archived_at: archivedAt,
          is_visible: false,
        }),
      );
    },
    onMutate: async (products) => {
      const previous = await snapshotProducts();
      const archivedAt = new Date().toISOString();
      updateManyProductsCache(
        products.map((p) => p.id),
        { archived_at: archivedAt, is_visible: false },
      );
      return { previous };
    },
    onError: (e, _vars, context) => {
      if (context?.previous) restoreProducts(context.previous);
      toast.error(humanizeError(e, { fallback: "Could not archive products." }));
    },
    onSuccess: (_data, products) =>
      toast.success(`Archived ${products.length} product${products.length === 1 ? "" : "s"}`),
    onSettled: () => invalidate(),
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => moveToRecycle({ data: { entity_type: "product", id } })));
    },
    onMutate: async (ids) => {
      const previous = await snapshotProducts();
      removeProductsFromCache(ids);
      return { previous };
    },
    onError: (e, _vars, context) => {
      if (context?.previous) restoreProducts(context.previous);
      toast.error(humanizeError(e, { fallback: "Could not delete products." }));
    },
    onSuccess: (_data, ids) => {
      toast.success(
        `Moved ${ids.length} product${ids.length === 1 ? "" : "s"} to recently deleted`,
      );
      void qc.invalidateQueries({ queryKey: ["admin-recycle"] });
    },
    onSettled: () => invalidate(),
  });

  const duplicate = useMutation({
    mutationFn: duplicateProduct,
    onSuccess: (newId) => {
      toast.success("Product duplicated (hidden until you publish it)");
      invalidate();
      navigate({
        ...adminProductEditTarget(newId),
        search: { step: "photos" },
      });
    },
    onError: (e: unknown) =>
      toast.error(humanizeError(e, { fallback: "Could not duplicate product." })),
  });

  return {
    toggleVisible,
    toggleFeatured,
    archive,
    restore,
    softDelete,
    bulkPublish,
    bulkArchive,
    bulkDelete,
    duplicate,
    isBusy:
      toggleVisible.isPending ||
      toggleFeatured.isPending ||
      archive.isPending ||
      restore.isPending ||
      softDelete.isPending ||
      bulkPublish.isPending ||
      bulkArchive.isPending ||
      bulkDelete.isPending ||
      duplicate.isPending,
  };
}
