import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminMobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer: ReactNode;
};

/**
 * In-tree mobile nav drawer (no portal) — avoids React removeChild crashes in
 * iframe simulators / SSR while staying viewport-fixed for Capacitor WebView.
 */
export function AdminMobileNavDrawer({
  open,
  onClose,
  title,
  children,
  footer,
}: AdminMobileNavDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] md:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/80"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside
        id="admin-mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="absolute top-0 left-0 bottom-0 flex w-[min(85vw,18rem)] flex-col border-r border-sidebar-border bg-sidebar pt-[env(safe-area-inset-top)] text-sidebar-foreground shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-sidebar-border px-5 py-5">
          <div className="min-w-0 flex-1 font-heading text-gold">{title}</div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-sidebar-foreground"
            aria-label="Close menu"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-auto p-3">
          {children}
        </nav>
        <div className="space-y-2 border-t border-sidebar-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      </aside>
    </div>
  );
}
