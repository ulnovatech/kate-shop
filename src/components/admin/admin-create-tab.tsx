import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminCreateTabProps = {
  active?: boolean;
  onClick: () => void;
  /** Number of create actions available — used for aria label */
  actionCount?: number;
};

/** Compact center create control — opens the create action sheet. */
export function AdminCreateTab({ active = false, onClick, actionCount = 1 }: AdminCreateTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={actionCount > 1 ? "Create — choose action" : "Add product"}
      aria-haspopup="dialog"
      aria-expanded={false}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
        "border border-sidebar-border/80 bg-gold text-gold-foreground",
        "transition-transform active:scale-95",
        active && "ring-1 ring-gold/90 ring-offset-1 ring-offset-sidebar",
      )}
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
    </button>
  );
}
