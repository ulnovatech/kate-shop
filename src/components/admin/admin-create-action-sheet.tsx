import { useState } from "react";
import { Package, Tag, UserPlus, type LucideIcon } from "lucide-react";
import { ProductWizard } from "@/components/admin/products/wizard/product-wizard";
import { CategoryWizard } from "@/components/admin/categories/category-wizard";
import { TeamInviteWizard } from "@/components/admin/team/team-invite-wizard";
import { AdminWizardDialog } from "@/components/admin/admin-wizard-dialog";
import { adminUrl } from "@/lib/admin-routes";
import type { AdminPermissions } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { adminToolbarControl } from "@/lib/admin-mobile";
import { TRANSITION_COMMON_CLASS } from "@kate/ui/tokens";

type CreateActionId = "product" | "category" | "invite";

type CreateAction = {
  id: CreateActionId;
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  show: (permissions: AdminPermissions) => boolean;
};

const CREATE_ACTIONS: CreateAction[] = [
  {
    id: "product",
    label: "Add product",
    description: "Photos, pricing, and shop listing",
    to: adminUrl("/products/new"),
    icon: Package,
    show: (p) => p.canManageCatalog,
  },
  {
    id: "category",
    label: "Add category",
    description: "Organize your catalog tree",
    to: adminUrl("/categories"),
    icon: Tag,
    show: (p) => p.canManageCatalog,
  },
  {
    id: "invite",
    label: "Invite teammate",
    description: "Send a one-time staff link",
    to: adminUrl("/team"),
    icon: UserPlus,
    show: (p) => p.canManageTeam,
  },
];

type AdminCreateActionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: AdminPermissions;
};

export function AdminCreateActionSheet({
  open,
  onOpenChange,
  permissions,
}: AdminCreateActionSheetProps) {
  const [activeFlow, setActiveFlow] = useState<CreateActionId | null>(null);
  const actions = CREATE_ACTIONS.filter((a) => a.show(permissions));

  const handleOpenChange = (next: boolean) => {
    if (!next) setActiveFlow(null);
    onOpenChange(next);
  };

  const closeWizard = () => handleOpenChange(false);

  const backToPicker = () => setActiveFlow(null);

  if (actions.length === 0) return null;

  const picker = (
    <>
      <header className="shrink-0 space-y-0.5 border-b px-4 pb-3 pt-4 pr-12">
        <h2 id="admin-create-title" className="type-h4 font-heading">
          Create
        </h2>
        <p id="admin-create-desc" className="type-caption text-muted-foreground">
          Choose what to add — each flow guides you step by step.
        </p>
      </header>
      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-y-auto p-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.id} className="mb-2 last:mb-0">
              <button
                type="button"
                onClick={() => setActiveFlow(action.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left",
                  adminToolbarControl,
                  TRANSITION_COMMON_CLASS,
                  "hover:bg-muted/50 active:scale-[0.99]",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block type-body-sm font-medium">{action.label}</span>
                  <span className="block type-caption text-muted-foreground">
                    {action.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );

  return (
    <AdminWizardDialog
      open={open}
      onOpenChange={handleOpenChange}
      aria-labelledby="admin-create-title"
      aria-describedby={activeFlow ? "admin-wizard-desc" : "admin-create-desc"}
      className={
        activeFlow ? "max-h-[min(92dvh,42rem)] sm:w-[min(calc(100vw-2rem),36rem)]" : undefined
      }
    >
      {!activeFlow ? (
        picker
      ) : activeFlow === "product" ? (
        <ProductWizard variant="modal" onComplete={closeWizard} onCancel={backToPicker} />
      ) : activeFlow === "category" ? (
        <CategoryWizard variant="modal" onComplete={closeWizard} onCancel={backToPicker} />
      ) : (
        <TeamInviteWizard variant="modal" onComplete={closeWizard} onCancel={backToPicker} />
      )}
    </AdminWizardDialog>
  );
}

export function adminCreateActionsVisible(permissions: AdminPermissions): boolean {
  return CREATE_ACTIONS.some((a) => a.show(permissions));
}

/** Paths that highlight the center Add tab when active. */
export function isAdminCreatePath(path: string): boolean {
  const productNew = adminUrl("/products/new");
  const categories = adminUrl("/categories");
  const team = adminUrl("/team");
  return (
    path === productNew ||
    path.startsWith(`${productNew}/`) ||
    path === categories ||
    path.startsWith(`${categories}/`) ||
    path === team ||
    path.startsWith(`${team}/`)
  );
}

export { CREATE_ACTIONS };
