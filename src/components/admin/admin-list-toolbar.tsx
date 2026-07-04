import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AdminListToolbarProps = {
  /** Typically OverlaySearch */
  search?: ReactNode;
  /** Filters between search and trailing (category select, segmented control, etc.) */
  children?: ReactNode;
  /** Right-aligned actions (sort, export, view toggle) */
  trailing?: ReactNode;
  className?: string;
  sticky?: boolean;
};

/**
 * Horizontal list filter bar — search icon, filters, and actions in one row.
 * Scrolls horizontally on narrow viewports with a trailing fade hint.
 */
export function AdminListToolbar({
  search,
  children,
  trailing,
  className,
  sticky = false,
}: AdminListToolbarProps) {
  return (
    <div
      className={cn(
        "relative admin-toolbar-fade",
        sticky &&
          "sticky top-0 z-sticky -mx-page-x border-b border-border/60 bg-background/95 px-page-x py-2 shadow-sm backdrop-blur-sm md:py-toolbar",
      )}
    >
      <div
        className={cn(
          "admin-toolbar-scroll flex flex-nowrap items-center gap-2 overflow-x-auto pb-0.5 md:gap-inline",
          className,
        )}
        role="toolbar"
        aria-label="List filters"
      >
        {search}
        {children}
        {trailing ? (
          <div className="flex shrink-0 items-center gap-2 md:ml-auto md:gap-inline-sm">
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}
