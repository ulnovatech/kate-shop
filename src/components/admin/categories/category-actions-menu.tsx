import { useCallback, useRef, useState, type ReactNode } from "react";
import { Eye, EyeOff, Package, Pencil, Plus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLongPress } from "@/hooks/use-long-press";
import type { AdminCategory } from "./types";

const LONG_PRESS_MS = 2000;

type MenuAnchor = { x: number; y: number };

export function CategoryActionsMenu({
  category,
  canAddSubcategory,
  onRename,
  onToggleHidden,
  onAddSubcategory,
  onViewProducts,
  onRequestDelete,
  disabled,
  children,
}: {
  category: AdminCategory;
  canAddSubcategory: boolean;
  onRename: () => void;
  onToggleHidden: (hidden: boolean) => void;
  onAddSubcategory: () => void;
  onViewProducts: () => void;
  onRequestDelete: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const suppressClickRef = useRef(false);
  const open = anchor !== null;

  const openAt = useCallback((x: number, y: number) => {
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 400);
    setAnchor({ x, y });
  }, []);

  const close = useCallback(() => setAnchor(null), []);

  const longPress = useLongPress((e) => openAt(e.clientX, e.clientY), { delayMs: LONG_PRESS_MS });

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
      e.preventDefault();
      e.stopPropagation();
      openAt(e.clientX, e.clientY);
    },
    [openAt],
  );

  const runAction = useCallback(
    (action: () => void) => {
      close();
      action();
    },
    [close],
  );

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DropdownMenuTrigger asChild>
        <span
          className="pointer-events-none fixed z-50 h-px w-px"
          style={
            anchor ? { left: anchor.x, top: anchor.y } : { left: 0, top: 0, visibility: "hidden" }
          }
          aria-hidden
        />
      </DropdownMenuTrigger>

      <div
        className="contents"
        onContextMenu={onContextMenu}
        onClickCapture={(e) => {
          if (!suppressClickRef.current) return;
          e.preventDefault();
          e.stopPropagation();
        }}
        {...longPress}
      >
        {children}
      </div>

      <DropdownMenuContent className="w-52" align="start" sideOffset={4}>
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {category.name}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => runAction(onRename)}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => runAction(onViewProducts)}>
          <Package className="mr-2 h-4 w-4" />
          View products
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => runAction(() => onToggleHidden(!category.is_hidden))}>
          {category.is_hidden ? (
            <>
              <Eye className="mr-2 h-4 w-4" /> Show on storefront
            </>
          ) : (
            <>
              <EyeOff className="mr-2 h-4 w-4" /> Hide from storefront
            </>
          )}
        </DropdownMenuItem>
        {canAddSubcategory && (
          <DropdownMenuItem onSelect={() => runAction(onAddSubcategory)}>
            <Plus className="mr-2 h-4 w-4" />
            Add subcategory
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => runAction(onRequestDelete)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { LONG_PRESS_MS as CATEGORY_ACTIONS_LONG_PRESS_MS };
