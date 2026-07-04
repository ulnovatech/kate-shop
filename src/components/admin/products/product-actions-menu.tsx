import { Link } from "@tanstack/react-router";
import {
  Archive,
  ArchiveRestore,
  Copy,
  Eye,
  EyeOff,
  MoreHorizontal,
  PenLine,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { adminProductEditTarget } from "@/lib/admin-routes";
import type { AdminProduct, ProductRecycleTarget } from "./types";

/** Borderless icon actions — 18px glyphs in 36px hit targets. */
const productActionButtonClass =
  "h-9 w-9 shrink-0 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-muted/50 hover:text-foreground [&_svg]:size-[1.125rem]";

type ProductActionsMenuProps = {
  product: AdminProduct;
  onToggleFeatured: () => void;
  onToggleVisible: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onRecycle: (target: ProductRecycleTarget) => void;
};

export function ProductActionsMenu({
  product,
  onToggleFeatured,
  onToggleVisible,
  onDuplicate,
  onArchive,
  onRestore,
  onRecycle,
}: ProductActionsMenuProps) {
  const archived = !!product.archived_at;
  const editTarget = adminProductEditTarget(product.id);
  const visibleLabel = product.is_visible ? "Hide from shop" : "Show on shop";
  const featuredLabel = product.is_featured ? "Unfeature product" : "Feature product";
  const deleteLabel = "Move to recently deleted";

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={productActionButtonClass}
        aria-label={featuredLabel}
        onClick={onToggleFeatured}
      >
        <Star className={cn(product.is_featured && "fill-gold text-gold")} aria-hidden />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={productActionButtonClass}
        aria-label={visibleLabel}
        onClick={onToggleVisible}
      >
        {product.is_visible ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
      </Button>
      <Button size="icon" variant="ghost" className={productActionButtonClass} asChild>
        <Link {...editTarget} aria-label={`Edit ${product.name}`}>
          <PenLine aria-hidden />
        </Link>
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={cn(
          productActionButtonClass,
          "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
        )}
        aria-label={deleteLabel}
        onClick={() => onRecycle({ id: product.id, name: product.name })}
      >
        <Trash2 aria-hidden />
      </Button>
      <MoreActionsMenu
        product={product}
        archived={archived}
        onDuplicate={onDuplicate}
        onArchive={onArchive}
        onRestore={onRestore}
        onRecycle={onRecycle}
        onToggleFeatured={onToggleFeatured}
      />
    </div>
  );
}

function MoreActionsMenu({
  product,
  archived,
  onDuplicate,
  onArchive,
  onRestore,
  onRecycle,
  onToggleFeatured,
}: {
  product: AdminProduct;
  archived: boolean;
  onDuplicate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onRecycle: (target: ProductRecycleTarget) => void;
  onToggleFeatured: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={productActionButtonClass}
          aria-label="More product actions"
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={onToggleFeatured}>
          <Star className="mr-2 h-4 w-4" />
          {product.is_featured ? "Unfeature" : "Feature"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="mr-2 h-4 w-4" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {archived ? (
          <DropdownMenuItem onClick={onRestore}>
            <ArchiveRestore className="mr-2 h-4 w-4" /> Restore from archive
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onArchive}>
            <Archive className="mr-2 h-4 w-4" /> Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onRecycle({ id: product.id, name: product.name })}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Move to recently deleted
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
