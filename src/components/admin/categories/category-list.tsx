import { useCallback, useState, type ReactNode } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin";
import type { CategoryTreeNode } from "@/lib/categories";
import { CategoryDeleteDialog } from "./category-delete-dialog";
import { CategoryListHint } from "./category-list-hint";
import { CATEGORY_HEADER_GRID_CLASS, categoryListStyle } from "./category-row-grid";
import { DraftCategoryRow } from "./category-row";
import { CategorySiblingList } from "./category-sibling-list";
import { useExpandedCategoryIds } from "./use-expanded-category-ids";
import type { AdminCategory, CategoryDraftRow } from "./types";

export type { AdminCategory } from "./types";

type AdminCategoryListProps = {
  tree: CategoryTreeNode[];
  categories: AdminCategory[];
  busy?: boolean;
  onCreate: (name: string, parentId: string | null) => void;
  onUpdate: (id: string, name: string) => void;
  onToggleHidden: (id: string, hidden: boolean) => void;
  onDelete: (id: string) => void;
  onViewProducts: (id: string) => void;
  onReorder: (parentId: string | null, orderedIds: string[]) => void;
};

export function AdminCategoryList({
  tree,
  categories,
  busy,
  onCreate,
  onUpdate,
  onToggleHidden,
  onDelete,
  onViewProducts,
  onReorder,
}: AdminCategoryListProps) {
  const { expandedIds, toggleExpand, expand } = useExpandedCategoryIds();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<CategoryDraftRow[]>([]);
  const [showRootDraft, setShowRootDraft] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  const addDraft = useCallback(
    (parentId: string | null) => {
      if (parentId) {
        expand(parentId);
        setDrafts((prev) => [...prev, { key: crypto.randomUUID(), parentId }]);
      } else {
        setShowRootDraft(true);
      }
    },
    [expand],
  );

  const commitDraft = useCallback(
    (key: string, name: string) => {
      const draft = drafts.find((d) => d.key === key);
      if (draft) {
        onCreate(name, draft.parentId);
        setDrafts((prev) => prev.filter((d) => d.key !== key));
      }
    },
    [drafts, onCreate],
  );

  const cancelDraft = useCallback((key: string) => {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  }, []);

  const commitRootDraft = useCallback(
    (name: string) => {
      onCreate(name, null);
      setShowRootDraft(false);
    },
    [onCreate],
  );

  const announce = useCallback((message: string) => {
    setLiveMessage(message);
  }, []);

  return (
    <div>
      <div
        className="overflow-hidden rounded-xl border bg-card shadow-sm"
        style={categoryListStyle}
      >
        <div className={CATEGORY_HEADER_GRID_CLASS}>
          <span aria-hidden />
          <span aria-hidden />
          <span aria-hidden />
          <span>Category</span>
          <span className="hidden md:block">Slug</span>
          <span className="hidden md:block">Status</span>
        </div>

        {busy && (
          <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving…
          </div>
        )}

        <CategorySiblingList
          nodes={tree}
          parentId={null}
          depth={1}
          categories={categories}
          expandedIds={expandedIds}
          onToggleExpand={toggleExpand}
          editingId={editingId}
          onStartEdit={setEditingId}
          onCommitEdit={(id, name) => {
            const current = categories.find((c) => c.id === id)?.name;
            if (current?.trim() === name.trim()) {
              setEditingId(null);
              return;
            }
            onUpdate(id, name);
            setEditingId(null);
          }}
          onCancelEdit={() => setEditingId(null)}
          onToggleHidden={(id, hidden) => {
            onToggleHidden(id, hidden);
            const label = categories.find((c) => c.id === id)?.name ?? "Category";
            announce(hidden ? `${label} hidden from storefront` : `${label} visible on storefront`);
          }}
          onRequestDelete={(id) => {
            const name = categories.find((c) => c.id === id)?.name ?? "this category";
            setDeleteTarget({ id, name });
          }}
          onViewProducts={onViewProducts}
          onReorder={onReorder}
          onAnnounce={announce}
          drafts={drafts}
          onAddDraft={addDraft}
          onCommitDraft={commitDraft}
          onCancelDraft={cancelDraft}
          busy={busy}
        />

        {showRootDraft && (
          <DraftCategoryRow
            parentId={null}
            depth={1}
            onCommit={commitRootDraft}
            onCancel={() => setShowRootDraft(false)}
          />
        )}
      </div>

      {!showRootDraft && (
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full gap-2 border-dashed sm:w-auto"
          disabled={busy}
          onClick={() => setShowRootDraft(true)}
        >
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      )}

      <CategoryDeleteDialog
        open={deleteTarget !== null}
        name={deleteTarget?.name ?? ""}
        busy={busy}
        onConfirm={() => {
          if (!deleteTarget) return;
          onDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />

      <CategoryListHint liveMessage={liveMessage} />
    </div>
  );
}

export function AdminCategoriesPageShell({
  children,
  categoryCount = 0,
}: {
  children: ReactNode;
  categoryCount?: number;
}) {
  return (
    <div className="space-y-section">
      <AdminPageHeader
        title="Categories"
        description="Organize products in up to three levels. Hidden categories stay in admin but not on the storefront."
        meta={`${categoryCount} ${categoryCount === 1 ? "category" : "categories"}`}
      />
      {children}
    </div>
  );
}
