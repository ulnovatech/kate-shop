import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminCategoriesPageShell,
  AdminCategoryList,
  type AdminCategory,
} from "@/components/admin-category-list";
import { ensureUniqueCategorySlug } from "@/lib/catalog";
import { recordAudit } from "@/lib/api/audit.functions";
import { moveToRecycle } from "@/lib/api/recycle.functions";
import { pickCategoryAuditFields } from "@/lib/audit";
import { adminProductsListTarget } from "@/lib/admin-routes";
import { buildCategoryTree, getChildCategories } from "@/lib/categories";
import { humanizeError } from "@/lib/errors";

export const Route = createFileRoute("/_staff/categories")({
  staticData: { adminPermission: "catalog" as const },
  component: AdminCategories,
});

function AdminCategories() {
  const qc = useQueryClient();
  const navigate = Route.useNavigate();

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () =>
      (await supabase.from("categories").select("*").is("deleted_at", null).order("sort_order"))
        .data ?? [],
  });

  const typedCategories = categories as AdminCategory[];
  const tree = useMemo(() => buildCategoryTree(typedCategories), [typedCategories]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const siblingCount = (pid: string | null) => getChildCategories(pid, typedCategories).length;

  const create = useMutation({
    mutationFn: async ({ n, parent_id }: { n: string; parent_id: string | null }) => {
      const slug = await ensureUniqueCategorySlug(n);
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: n,
          slug,
          parent_id,
          sort_order: siblingCount(parent_id),
        })
        .select()
        .single();
      if (error) throw error;
      void recordAudit({
        data: {
          action: "category_created",
          entity_type: "category",
          entity_id: data.id,
          after: pickCategoryAuditFields(data as Record<string, unknown>),
        },
      });
    },
    onSuccess: () => {
      toast.success("Category added");
      invalidate();
    },
    onError: (e: unknown) => toast.error(humanizeError(e, { fallback: "Could not add category." })),
  });

  const rename = useMutation({
    mutationFn: async ({ id, n }: { id: string; n: string }) => {
      const before = typedCategories.find((c) => c.id === id);
      const slug = await ensureUniqueCategorySlug(n, id);
      const { data, error } = await supabase
        .from("categories")
        .update({ name: n, slug })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      void recordAudit({
        data: {
          action: "category_updated",
          entity_type: "category",
          entity_id: id,
          before: before ? pickCategoryAuditFields(before as Record<string, unknown>) : null,
          after: pickCategoryAuditFields(data as Record<string, unknown>),
        },
      });
    },
    onSuccess: () => invalidate(),
    onError: (e: unknown) =>
      toast.error(humanizeError(e, { fallback: "Could not update category." })),
  });

  const toggleHidden = useMutation({
    mutationFn: async ({ id, hidden }: { id: string; hidden: boolean }) => {
      const before = typedCategories.find((c) => c.id === id);
      const { data, error } = await supabase
        .from("categories")
        .update({ is_hidden: hidden })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      void recordAudit({
        data: {
          action: "category_updated",
          entity_type: "category",
          entity_id: id,
          before: before ? pickCategoryAuditFields(before as Record<string, unknown>) : null,
          after: pickCategoryAuditFields(data as Record<string, unknown>),
        },
      });
    },
    onSuccess: () => invalidate(),
  });

  const reorder = useMutation({
    mutationFn: async ({ orderedIds }: { parentId: string | null; orderedIds: string[] }) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from("categories").update({ sort_order: index }).eq("id", id),
        ),
      );
    },
    onSuccess: () => invalidate(),
    onError: (e: unknown) =>
      toast.error(humanizeError(e, { fallback: "Could not reorder categories." })),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const hasChildren = typedCategories.some((c) => c.parent_id === id);
      if (hasChildren) {
        throw new Error("Remove or reassign subcategories before deleting this category");
      }
      return moveToRecycle({ data: { entity_type: "category", id } });
    },
    onSuccess: () => {
      toast.success("Moved to recycle bin");
      invalidate();
      qc.invalidateQueries({ queryKey: ["admin-recycle"] });
    },
    onError: (e: unknown) =>
      toast.error(humanizeError(e, { fallback: "Could not delete category." })),
  });

  const busy = create.isPending || rename.isPending || toggleHidden.isPending || del.isPending;

  return (
    <AdminCategoriesPageShell categoryCount={typedCategories.length}>
      <AdminCategoryList
        tree={tree}
        categories={typedCategories}
        busy={busy}
        onCreate={(name, parentId) => create.mutate({ n: name, parent_id: parentId })}
        onUpdate={(id, name) => rename.mutate({ id, n: name })}
        onToggleHidden={(id, hidden) => toggleHidden.mutate({ id, hidden })}
        onDelete={(id) => del.mutate(id)}
        onViewProducts={(categoryId) => navigate(adminProductsListTarget(categoryId))}
        onReorder={(parentId, orderedIds) => reorder.mutate({ parentId, orderedIds })}
      />
    </AdminCategoriesPageShell>
  );
}
