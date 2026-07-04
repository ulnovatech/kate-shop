import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminConfirmDialog, AdminPageHeader } from "@/components/admin";
import { EmptyState } from "@/components/empty-state";
import { DataTableSkeleton } from "@/components/loading-states";
import { listRecycleBin, purgeFromRecycle, restoreFromRecycle } from "@/lib/api/recycle.functions";
import { useAuth } from "@/lib/auth";
import type { RecycleEntityType } from "@/lib/recycle";
import { humanizeError } from "@/lib/errors";
import { RecycleListHeader, RecycleRow, type RecycleListItem } from "./recycle-row";

export function RecycleListPage() {
  const qc = useQueryClient();
  const { permissions } = useAuth();
  const [purgeTarget, setPurgeTarget] = useState<RecycleListItem | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-recycle"],
    queryFn: () => listRecycleBin(),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-recycle"] });
    void qc.invalidateQueries({ queryKey: ["admin-products"] });
    void qc.invalidateQueries({ queryKey: ["admin-categories"] });
    void qc.invalidateQueries({ queryKey: ["categories"] });
    void qc.invalidateQueries({ queryKey: ["admin-audit"] });
  };

  const restore = useMutation({
    mutationFn: (input: { entity_type: RecycleEntityType; id: string }) =>
      restoreFromRecycle({ data: input }),
    onSuccess: () => {
      toast.success("Restored from recently deleted");
      invalidate();
    },
    onError: (e: unknown) => toast.error(humanizeError(e, { fallback: "Could not restore item." })),
  });

  const purge = useMutation({
    mutationFn: (input: { entity_type: RecycleEntityType; id: string }) =>
      purgeFromRecycle({ data: input }),
    onSuccess: () => {
      toast.success("Permanently deleted");
      setPurgeTarget(null);
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(humanizeError(e, { fallback: "Could not permanently delete item." })),
  });

  const busy = restore.isPending || purge.isPending;

  return (
    <div className="space-y-section">
      <AdminPageHeader
        title="Recently deleted"
        description={`Soft-deleted products and categories. Restore to bring them back, or purge to delete permanently${permissions.canManageSettings ? " (owner only)" : ""}.`}
        meta={isLoading ? "Loading…" : `${items.length} item${items.length === 1 ? "" : "s"}`}
      />

      <div className="overflow-hidden rounded-lg border bg-card shadow-elevated">
        {isLoading ? (
          <div className="p-4">
            <DataTableSkeleton rows={5} cols={4} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-card">
            <EmptyState
              illustration="catalog"
              icon={Trash2}
              title="Recently deleted is empty"
              description="Deleted products and categories will appear here so you can restore them."
            />
          </div>
        ) : (
          <>
            <RecycleListHeader />
            <div role="list">
              {items.map((item) => (
                <RecycleRow
                  key={`${item.entity_type}-${item.id}`}
                  item={item}
                  canPurge={permissions.canManageSettings}
                  busy={busy}
                  onRestore={() => restore.mutate({ entity_type: item.entity_type, id: item.id })}
                  onPurge={() => setPurgeTarget(item)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <AdminConfirmDialog
        open={purgeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPurgeTarget(null);
        }}
        title="Permanently delete?"
        description={
          purgeTarget ? (
            <>
              <strong>{purgeTarget.name}</strong> will be removed forever. This cannot be undone.
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Delete permanently"
        destructive
        busy={purge.isPending}
        onConfirm={() => {
          if (!purgeTarget) return;
          purge.mutate({ entity_type: purgeTarget.entity_type, id: purgeTarget.id });
        }}
      />
    </div>
  );
}
