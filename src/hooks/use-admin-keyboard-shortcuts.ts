import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isEditableTarget } from "@/lib/admin-keyboard-shortcuts";
import { adminUrl } from "@/lib/admin-routes";
import type { AdminPermissions } from "@/lib/rbac";

type UseAdminKeyboardShortcutsOptions = {
  enabled: boolean;
  permissions: AdminPermissions;
  onOpenPalette: () => void;
  onOpenShortcuts: () => void;
  onToggleFocusMode: () => void;
};

export function useAdminKeyboardShortcuts({
  enabled,
  permissions,
  onOpenPalette,
  onOpenShortcuts,
  onToggleFocusMode,
}: UseAdminKeyboardShortcutsOptions) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;

    let goPending = false;
    let goTimer: ReturnType<typeof setTimeout> | null = null;

    const clearGo = () => {
      goPending = false;
      if (goTimer) clearTimeout(goTimer);
      goTimer = null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenPalette();
        clearGo();
        return;
      }

      if (mod && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        onToggleFocusMode();
        clearGo();
        return;
      }

      if (e.key === "?" && !isEditableTarget(e.target)) {
        e.preventDefault();
        onOpenShortcuts();
        clearGo();
        return;
      }

      if (isEditableTarget(e.target) || mod || e.altKey) return;

      if (e.key.toLowerCase() === "g") {
        goPending = true;
        if (goTimer) clearTimeout(goTimer);
        goTimer = setTimeout(clearGo, 1200);
        return;
      }

      if (goPending) {
        const key = e.key.toLowerCase();
        if (key === "h") {
          e.preventDefault();
          void navigate({ to: adminUrl("/") });
        } else if (key === "o" && permissions.canManageOrders) {
          e.preventDefault();
          void navigate({ to: adminUrl("/orders") });
        } else if (key === "p" && permissions.canManageCatalog) {
          e.preventDefault();
          void navigate({ to: adminUrl("/products") });
        }
        clearGo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearGo();
    };
  }, [enabled, navigate, onOpenPalette, onOpenShortcuts, onToggleFocusMode, permissions]);
}
