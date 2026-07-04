import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminBulkActionBarProps = {
  active: boolean;
  selectedCount: number;
  totalOnPage: number;
  allOnPageSelected: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  children: ReactNode;
  className?: string;
};

export function AdminBulkActionBar({
  active,
  selectedCount,
  totalOnPage,
  allOnPageSelected,
  onSelectAll,
  onClearSelection,
  children,
  className,
}: AdminBulkActionBarProps) {
  if (!active) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 shadow-elevated motion-safe:animate-fade-in",
        className,
      )}
      role="toolbar"
      aria-label="Bulk actions"
    >
      <p className="mr-auto type-body-sm font-medium">
        {selectedCount === 1 ? "1 product selected" : `${selectedCount} products selected`}
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onSelectAll}>
        {allOnPageSelected ? "Clear page" : `Select all (${totalOnPage})`}
      </Button>
      {children}
      <Button type="button" variant="ghost" size="sm" onClick={onClearSelection}>
        Cancel
      </Button>
    </div>
  );
}
