import { ChevronRight, GripVertical } from "lucide-react";
import { MAX_CATEGORY_DEPTH } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { SortableDragState, useSortableList } from "@/hooks/use-sortable-list";
import { CategoryInlineNameField } from "./category-inline-name";
import { CategoryActionsMenu } from "./category-actions-menu";
import { CategoryStatusPill } from "./category-status-pill";
import { CATEGORY_ROW_GRID_CLASS, CategoryThreadCell } from "./category-row-grid";
import type { AdminCategory } from "./types";

type HandlePointerHandlers = ReturnType<
  ReturnType<typeof useSortableList>["getHandlePointerHandlers"]
>;

export function SortableCategoryRow({
  category,
  depth,
  dragState,
  handlePointerHandlers,
  editingId,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onToggleHidden,
  onRequestDelete,
  onAddSubcategory,
  onViewProducts,
  canExpand,
  expanded,
  onToggleExpand,
  childCount,
  subListId,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  category: AdminCategory;
  depth: number;
  dragState: SortableDragState;
  handlePointerHandlers: HandlePointerHandlers;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onCommitEdit: (id: string, name: string) => void;
  onCancelEdit: () => void;
  onToggleHidden: (hidden: boolean) => void;
  onRequestDelete: () => void;
  onAddSubcategory: () => void;
  onViewProducts: () => void;
  canExpand: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  childCount: number;
  subListId?: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const isDragging = dragState.activeId === category.id;
  const isEditing = editingId === category.id;
  const listIsDragging = dragState.activeId !== null;

  return (
    <div
      data-sortable-id={category.id}
      className={cn(
        CATEGORY_ROW_GRID_CLASS,
        "border-b border-border/60 last:border-b-0",
        category.is_hidden && !isDragging && "opacity-60",
        isDragging &&
          "relative z-20 cursor-grabbing rounded-md border border-primary/20 bg-card shadow-lg",
        !isDragging && listIsDragging && "transition-[transform,opacity] duration-200 ease-out",
      )}
      style={{
        transform: isDragging ? `translateY(${dragState.translateY}px) scale(1.01)` : undefined,
        touchAction: isDragging ? "none" : undefined,
      }}
    >
      <CategoryThreadCell depth={depth} />

      <button
        type="button"
        data-sortable-handle
        className={cn(
          "flex h-8 w-6 shrink-0 cursor-grab items-center justify-center justify-self-center rounded-md text-muted-foreground/50",
          "hover:bg-secondary/60 hover:text-muted-foreground active:cursor-grabbing",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          isDragging && "cursor-grabbing text-muted-foreground",
        )}
        aria-label={`Drag to reorder ${category.name}`}
        aria-keyshortcuts="ArrowUp ArrowDown"
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" && canMoveUp) {
            e.preventDefault();
            onMoveUp();
          }
          if (e.key === "ArrowDown" && canMoveDown) {
            e.preventDefault();
            onMoveDown();
          }
        }}
        {...handlePointerHandlers}
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>

      {canExpand ? (
        <button
          type="button"
          data-no-drag
          onClick={onToggleExpand}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center justify-self-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            expanded && "bg-secondary text-foreground",
          )}
          aria-expanded={expanded}
          aria-controls={subListId}
          aria-label={expanded ? "Collapse subcategories" : "Expand subcategories"}
        >
          <ChevronRight
            className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-90")}
          />
        </button>
      ) : (
        <span className="h-7 w-7 shrink-0 justify-self-center" aria-hidden />
      )}

      <CategoryActionsMenu
        category={category}
        canAddSubcategory={depth < MAX_CATEGORY_DEPTH}
        disabled={isEditing || listIsDragging}
        onRename={() => onStartEdit(category.id)}
        onToggleHidden={onToggleHidden}
        onAddSubcategory={onAddSubcategory}
        onViewProducts={onViewProducts}
        onRequestDelete={onRequestDelete}
      >
        <div className="min-w-0">
          {isEditing ? (
            <CategoryInlineNameField
              value={category.name}
              autoFocus
              onCommit={(name) => onCommitEdit(category.id, name)}
              onCancel={onCancelEdit}
            />
          ) : (
            <button
              type="button"
              data-no-drag
              className={cn(
                "-mx-1 block w-full truncate rounded-md px-1 py-0.5 text-left font-medium text-foreground",
                "hover:bg-secondary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              )}
              onClick={() => onStartEdit(category.id)}
              aria-label={`Edit name: ${category.name}`}
            >
              {category.name}
            </button>
          )}
          <p className="mt-0.5 truncate text-xs text-muted-foreground md:hidden">{category.slug}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 md:hidden">
            <CategoryStatusPill hidden={category.is_hidden} onToggle={onToggleHidden} />
            {childCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {childCount} sub{childCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>

        <p className="hidden truncate text-xs text-muted-foreground md:block">{category.slug}</p>

        <div className="hidden min-w-0 items-center gap-2 text-xs text-muted-foreground md:flex md:justify-self-start">
          <CategoryStatusPill hidden={category.is_hidden} onToggle={onToggleHidden} />
          {childCount > 0 && (
            <span className="hidden text-muted-foreground sm:inline">
              {childCount} sub{childCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </CategoryActionsMenu>
    </div>
  );
}

export function DraftCategoryRow({
  parentId,
  depth,
  onCommit,
  onCancel,
}: {
  parentId: string | null;
  depth: number;
  onCommit: (name: string) => void;
  onCancel: () => void;
}) {
  return (
    <div
      className={cn(
        CATEGORY_ROW_GRID_CLASS,
        "border-b border-dashed border-primary/30 bg-primary/5",
      )}
    >
      <CategoryThreadCell depth={depth} />
      <GripVertical className="h-4 w-4 shrink-0 justify-self-center text-transparent" aria-hidden />
      <span className="h-7 w-7 shrink-0 justify-self-center" aria-hidden />
      <div className="col-span-1 min-w-0 md:col-span-3">
        <CategoryInlineNameField
          value=""
          placeholder={parentId ? "Subcategory name" : "Category name"}
          autoFocus
          onCommit={onCommit}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}
