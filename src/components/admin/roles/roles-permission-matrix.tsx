import { Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PERMISSION_ACTIONS, type PermissionAction } from "@kate/domain/permissions";
import type { PermissionKey } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type MatrixMeta = {
  modules: Record<string, { key: string; action: string; actionLabel: string }[]>;
  moduleLabels: Record<string, string>;
};

type RolesPermissionMatrixProps = {
  matrixMeta: MatrixMeta;
  keys: Set<PermissionKey>;
  onToggle?: (key: PermissionKey, checked: boolean) => void;
  disabled?: boolean;
};

function moduleHasAction(
  matrixMeta: MatrixMeta,
  module: string,
  action: PermissionAction,
): PermissionKey | null {
  const entry = matrixMeta.modules[module]?.find((a) => a.action === action);
  return entry ? (entry.key as PermissionKey) : null;
}

export function RolesPermissionMatrix({
  matrixMeta,
  keys,
  onToggle,
  disabled = false,
}: RolesPermissionMatrixProps) {
  const modules = Object.keys(matrixMeta.modules);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 font-medium">Module</th>
            {PERMISSION_ACTIONS.map((action) => (
              <th key={action} className="px-2 py-3 text-center font-medium">
                {action === "view"
                  ? "View"
                  : action === "create"
                    ? "Create"
                    : action === "edit"
                      ? "Edit"
                      : action === "delete"
                        ? "Delete"
                        : action === "approve"
                          ? "Approve"
                          : action === "export"
                            ? "Export"
                            : "Manage"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modules.map((mod) => (
            <tr key={mod} className="border-t">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-card px-4 py-3 text-left font-medium text-foreground"
              >
                {matrixMeta.moduleLabels[mod] ?? mod}
              </th>
              {PERMISSION_ACTIONS.map((action) => {
                const permKey = moduleHasAction(matrixMeta, mod, action);
                if (!permKey) {
                  return (
                    <td key={action} className="px-2 py-3 text-center text-muted-foreground/30">
                      —
                    </td>
                  );
                }

                const checked = keys.has(permKey);
                const readOnly = disabled || !onToggle;

                return (
                  <td key={action} className="px-2 py-3 text-center">
                    {readOnly ? (
                      <span
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-md",
                          checked ? "bg-primary/10 text-primary" : "text-muted-foreground/40",
                        )}
                        aria-label={checked ? "Granted" : "Not granted"}
                      >
                        {checked ? <Check className="h-4 w-4" aria-hidden /> : null}
                      </span>
                    ) : (
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => onToggle(permKey, v === true)}
                        aria-label={`${matrixMeta.moduleLabels[mod] ?? mod} ${action}`}
                        className="mx-auto"
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
