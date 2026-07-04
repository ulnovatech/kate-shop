import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { MAX_CATEGORY_DEPTH, type CategoryTreeNode } from "@/lib/categories";
import { reorderIds, useSortableList } from "@/hooks/use-sortable-list";
import { DraftCategoryRow, SortableCategoryRow } from "./category-row";
import type { AdminCategory, CategoryDraftRow } from "./types";

function CategoryEmptySubState({
  depth,
  busy,
  onAddDraft,
  parentId,
}: {
  depth: number;
  busy?: boolean;
  onAddDraft: (parentId: string) => void;
  parentId: string;
}) {
  return (
    <div
      className="border-b border-border/40 px-3 py-5 text-center"
      style={{ paddingLeft: `calc(var(--cat-thread) + ${0.75 + (depth - 1) * 0.75}rem)` }}
    >
      <p className="text-sm text-muted-foreground">No subcategories yet.</p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        data-no-drag
        disabled={busy}
        className="mt-2 h-8 gap-1.5 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
        onClick={() => onAddDraft(parentId)}
      >
        <Plus className="h-4 w-4" />
        Add subcategory
      </Button>
    </div>
  );
}

export function CategorySiblingList({
  nodes,
  parentId,
  depth,
  categories,
  expandedIds,
  onToggleExpand,
  editingId,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onToggleHidden,
  onRequestDelete,
  onViewProducts,
  onReorder,
  onAnnounce,
  drafts,
  onAddDraft,
  onCommitDraft,
  onCancelDraft,
  busy,
}: {
  nodes: CategoryTreeNode[];
  parentId: string | null;
  depth: number;
  categories: AdminCategory[];
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onCommitEdit: (id: string, name: string) => void;
  onCancelEdit: () => void;
  onToggleHidden: (id: string, hidden: boolean) => void;
  onRequestDelete: (id: string) => void;
  onViewProducts: (id: string) => void;
  onReorder: (parentId: string | null, orderedIds: string[]) => void;
  onAnnounce?: (message: string) => void;
  drafts: CategoryDraftRow[];
  onAddDraft: (parentId: string | null) => void;
  onCommitDraft: (key: string, name: string) => void;
  onCancelDraft: (key: string) => void;
  busy?: boolean;
}) {
  const itemIds = nodes.map((n) => n.id);
  const { containerRef, dragState, isDragging, getHandlePointerHandlers } = useSortableList({
    itemIds,
    onReorder: (orderedIds, movedId) => {
      onReorder(parentId, orderedIds);
      if (onAnnounce) {
        const name = nodes.find((n) => n.id === movedId)?.name ?? "Category";
        onAnnounce(`${name} reordered`);
      }
    },
  });

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const displayNodes = useMemo(() => {
    if (!dragState.activeId) return nodes;
    return dragState.order
      .map((id) => nodeById.get(id))
      .filter((n): n is CategoryTreeNode => Boolean(n));
  }, [dragState.activeId, dragState.order, nodeById, nodes]);

  const parentDrafts = drafts.filter((d) => d.parentId === parentId);

  const moveSibling = (id: string, direction: "up" | "down") => {
    const ids = nodes.map((n) => n.id);
    const index = ids.indexOf(id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= ids.length) return;
    const next = reorderIds(ids, id, target);
    onReorder(parentId, next);
    const name = nodes.find((n) => n.id === id)?.name ?? "Category";
    onAnnounce?.(`${name} moved ${direction}`);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        depth > 1 && "border-l border-border/80 bg-muted/20",
        isDragging && "select-none",
      )}
      role={depth === 1 && nodes.length > 0 ? "list" : undefined}
      aria-label={depth === 1 && nodes.length > 0 ? "Categories" : undefined}
    >
      {nodes.length === 0 && parentDrafts.length === 0 && depth === 1 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        displayNodes.map((node, index) => {
          const expanded = expandedIds.has(node.id);
          const canExpand = node.children.length > 0 || depth < MAX_CATEGORY_DEPTH;
          const childDrafts = drafts.filter((d) => d.parentId === node.id);
          const subListId = `category-subs-${node.id}`;
          const showEmptySubState =
            expanded &&
            node.children.length === 0 &&
            childDrafts.length === 0 &&
            depth < MAX_CATEGORY_DEPTH;

          return (
            <div key={node.id} role="listitem">
              <SortableCategoryRow
                category={node}
                depth={depth}
                dragState={dragState}
                handlePointerHandlers={getHandlePointerHandlers(node.id)}
                editingId={editingId}
                onStartEdit={onStartEdit}
                onCommitEdit={onCommitEdit}
                onCancelEdit={onCancelEdit}
                onToggleHidden={(hidden) => onToggleHidden(node.id, hidden)}
                onRequestDelete={() => onRequestDelete(node.id)}
                onAddSubcategory={() => onAddDraft(node.id)}
                onViewProducts={() => onViewProducts(node.id)}
                canExpand={canExpand}
                expanded={expanded}
                onToggleExpand={() => onToggleExpand(node.id)}
                subListId={canExpand ? subListId : undefined}
                canMoveUp={index > 0}
                canMoveDown={index < displayNodes.length - 1}
                onMoveUp={() => moveSibling(node.id, "up")}
                onMoveDown={() => moveSibling(node.id, "down")}
                childCount={node.children.length}
              />

              {canExpand && (
                <Collapsible open={expanded}>
                  <CollapsibleContent id={subListId} className="overflow-hidden">
                    {showEmptySubState ? (
                      <CategoryEmptySubState
                        depth={depth + 1}
                        busy={busy}
                        parentId={node.id}
                        onAddDraft={onAddDraft}
                      />
                    ) : (
                      <CategorySiblingList
                        nodes={node.children}
                        parentId={node.id}
                        depth={depth + 1}
                        categories={categories}
                        expandedIds={expandedIds}
                        onToggleExpand={onToggleExpand}
                        editingId={editingId}
                        onStartEdit={onStartEdit}
                        onCommitEdit={onCommitEdit}
                        onCancelEdit={onCancelEdit}
                        onToggleHidden={onToggleHidden}
                        onRequestDelete={onRequestDelete}
                        onViewProducts={onViewProducts}
                        onReorder={onReorder}
                        onAnnounce={onAnnounce}
                        drafts={drafts}
                        onAddDraft={onAddDraft}
                        onCommitDraft={onCommitDraft}
                        onCancelDraft={onCancelDraft}
                        busy={busy}
                      />
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          );
        })
      )}

      {parentDrafts.map((draft) => (
        <DraftCategoryRow
          key={draft.key}
          parentId={draft.parentId}
          depth={depth}
          onCommit={(name) => onCommitDraft(draft.key, name)}
          onCancel={() => onCancelDraft(draft.key)}
        />
      ))}

      {depth > 1 && nodes.length > 0 && !parentDrafts.length && (
        <div className="border-b border-border/40 px-3 py-2 pl-[calc(var(--cat-thread)+0.75rem)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-no-drag
            disabled={busy}
            className="h-8 gap-1.5 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
            onClick={() => parentId && onAddDraft(parentId)}
          >
            <Plus className="h-4 w-4" />
            Add subcategory
          </Button>
        </div>
      )}
    </div>
  );
}
