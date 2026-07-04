import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MobileStickyBarProps = {
  children: ReactNode;
  className?: string;
  /** Breakpoint at and above which the bar is hidden. */
  hideFrom?: "md" | "lg";
  /** Offset above the storefront bottom tab bar on mobile. */
  aboveTabBar?: boolean;
};

export function MobileStickyBar({
  children,
  className,
  hideFrom = "md",
  aboveTabBar = false,
}: MobileStickyBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 z-30 border-t bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur",
        aboveTabBar
          ? "bottom-[calc(var(--storefront-tab-height)+env(safe-area-inset-bottom))]"
          : "bottom-0",
        hideFrom === "lg" ? "lg:hidden" : "md:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
