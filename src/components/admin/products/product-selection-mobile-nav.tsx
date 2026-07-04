import { useState } from "react";
import {
  Archive,
  CheckSquare,
  Download,
  Eye,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ProductSelectionMobileNavProps = {
  selectedCount: number;
  totalOnPage: number;
  allOnPageSelected: boolean;
  busy?: boolean;
  onSelectAll: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onExport: () => void;
  onDelete: () => void;
};

function SelectionNavButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: typeof Eye;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium transition-colors touch-manipulation",
        disabled ? "opacity-40" : "active:text-white",
      )}
    >
      <Icon className="h-6 w-6 shrink-0" aria-hidden />
      <span className="max-w-full truncate">{label}</span>
    </button>
  );
}

export function ProductSelectionMobileNav({
  selectedCount,
  totalOnPage,
  allOnPageSelected,
  busy = false,
  onSelectAll,
  onPublish,
  onArchive,
  onExport,
  onDelete,
}: ProductSelectionMobileNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const noneSelected = selectedCount === 0;
  const selectAllLabel = allOnPageSelected ? "Clear all" : "Select all";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-emerald-800/50 bg-emerald-950 pb-[env(safe-area-inset-bottom)] text-emerald-50 shadow-[0_-4px_24px_rgba(0,0,0,0.35)] md:hidden"
      aria-label="Product selection actions"
    >
      <SelectionNavButton
        label={selectAllLabel}
        icon={CheckSquare}
        onClick={onSelectAll}
        disabled={busy || totalOnPage === 0}
      />
      <SelectionNavButton
        label="Publish"
        icon={Eye}
        onClick={onPublish}
        disabled={busy || noneSelected}
      />
      <SelectionNavButton
        label="Archive"
        icon={Archive}
        onClick={onArchive}
        disabled={busy || noneSelected}
      />
      <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={busy}
            className={cn(
              "flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium touch-manipulation",
              moreOpen ? "text-white" : "",
            )}
            aria-label="More actions"
          >
            <MoreHorizontal className="h-6 w-6 shrink-0" aria-hidden />
            More
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="mb-2 w-48">
          <DropdownMenuItem disabled={noneSelected} onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={noneSelected || busy}
            className="text-destructive focus:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

export function ProductSelectionMobileHeader({
  selectedCount,
  onCancel,
}: {
  selectedCount: number;
  onCancel: () => void;
}) {
  const label =
    selectedCount === 1 ? "1 product selected" : `${selectedCount} products selected`;

  return (
    <div className="sticky top-0 z-sticky -mx-page-x flex items-center gap-3 border-b border-emerald-800/40 bg-emerald-950 px-page-x py-2.5 text-emerald-50 shadow-sm md:hidden">
      <button
        type="button"
        onClick={onCancel}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-emerald-700/60 bg-emerald-900/60 text-emerald-50 touch-manipulation"
        aria-label="Cancel selection"
      >
        <span className="text-xl font-light leading-none" aria-hidden>
          ×
        </span>
      </button>
      <p className="min-w-0 flex-1 truncate text-sm font-medium">{label}</p>
    </div>
  );
}
