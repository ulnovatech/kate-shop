import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle2, SearchX } from "lucide-react";
import { toast } from "sonner";
import { AdminListToolbar, AdminPageHeader, AdminSegmentedFilter } from "@/components/admin";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { CardListSkeleton, InlineCountLoader } from "@/components/loading-states";
import { listNotifications, markNotificationSent } from "@/lib/api/notifications.server";
import {
  NOTIFICATION_LIST_STATUSES,
  buildListQueryKey,
  type AdminNotificationListFilters,
  type NotificationListStatus,
} from "@/lib/list-filters";
import { humanizeError } from "@/lib/errors";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { NotificationRow } from "./notification-row";

const STATUS_OPTIONS = NOTIFICATION_LIST_STATUSES.map((value) => ({
  value,
  label: value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1),
}));

type NotificationListPageProps = {
  applied: AdminNotificationListFilters;
  draft: AdminNotificationListFilters;
  hasActiveFilters: boolean;
  onStatusChange: (status: NotificationListStatus) => void;
  onClearFilters: () => void;
};

export function NotificationListPage({
  applied,
  draft,
  hasActiveFilters,
  onStatusChange,
  onClearFilters,
}: NotificationListPageProps) {
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: buildListQueryKey("admin-notifications", applied),
    queryFn: () =>
      listNotifications({
        data: {
          status: applied.status === "all" ? undefined : applied.status,
          limit: 50,
        },
      }),
  });

  const pendingOnPage = useMemo(
    () => notifications.filter((n) => n.status === "pending"),
    [notifications],
  );

  const batchMode = applied.status === "pending" || applied.status === "all";
  const allPendingSelected =
    pendingOnPage.length > 0 && pendingOnPage.every((n) => selectedIds.has(n.id));

  const toggleSelected = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAllPending = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(pendingOnPage.map((n) => n.id)));
  };

  const markSent = useMutation({
    mutationFn: (id: string) => markNotificationSent({ data: { notificationId: id } }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin-notifications"] });
      const previous = qc.getQueriesData({ queryKey: ["admin-notifications"] });
      qc.setQueriesData({ queryKey: ["admin-notifications"] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((n) =>
          n && typeof n === "object" && "id" in n && n.id === id
            ? { ...n, status: "sent", sent_at: new Date().toISOString() }
            : n,
        );
      });
      return { previous };
    },
    onError: (e: unknown, _id, context) => {
      context?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(humanizeError(e, { fallback: "Could not mark this message as sent." }));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  const batchMarkSent = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => markNotificationSent({ data: { notificationId: id } })),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        throw new Error(`${failed} of ${ids.length} could not be marked sent`);
      }
      return ids.length;
    },
    onSuccess: (count) => {
      toast.success(`Marked ${count} notification${count === 1 ? "" : "s"} as sent`);
      setSelectedIds(new Set());
    },
    onError: (e: unknown) => {
      toast.error(humanizeError(e, { fallback: "Could not mark selected messages as sent." }));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  const handleMarkSent = (id: string) => {
    markSent.mutate(id, {
      onSuccess: () => toast.success("Marked as sent"),
    });
  };

  return (
    <div className="space-y-section">
      <AdminPageHeader
        title="Notifications"
        description="Customer messages queued on order placed, payment confirmed, and shipped. Send manually via WhatsApp in Phase 1."
        meta={
          isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <InlineCountLoader />
              Fetching…
            </span>
          ) : (
            `${notifications.length} notification${notifications.length === 1 ? "" : "s"}`
          )
        }
      />

      <AdminListToolbar sticky>
        <AdminSegmentedFilter
          value={draft.status}
          onChange={(status) => {
            setSelectedIds(new Set());
            onStatusChange(status);
          }}
          ariaLabel="Notification status"
          options={STATUS_OPTIONS}
        />
        {batchMode && pendingOnPage.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={toggleSelectAllPending}>
              {allPendingSelected
                ? "Clear selection"
                : `Select all pending (${pendingOnPage.length})`}
            </Button>
            {selectedIds.size > 0 ? (
              <Button
                type="button"
                size="sm"
                className={adminPrimaryTouch}
                disabled={batchMarkSent.isPending}
                onClick={() => batchMarkSent.mutate([...selectedIds])}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Mark {selectedIds.size} sent
              </Button>
            ) : null}
          </div>
        ) : null}
      </AdminListToolbar>

      <div className="overflow-hidden rounded-lg border bg-card shadow-elevated max-md:border-0 max-md:bg-transparent max-md:shadow-none">
        {isLoading ? (
          <div className="p-4">
            <CardListSkeleton rows={4} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-card">
            {hasActiveFilters ? (
              <EmptyState
                illustration="search"
                icon={SearchX}
                title="No notifications match"
                description="Try a different status filter."
                primaryAction={{ label: "Show pending", onClick: onClearFilters }}
              />
            ) : (
              <EmptyState
                illustration="inbox"
                icon={Bell}
                title="No notifications"
                description="Messages will appear here when orders trigger customer notifications."
              />
            )}
          </div>
        ) : (
          <div role="list" className="max-md:py-3">
            {notifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onMarkSent={handleMarkSent}
                markingSent={markSent.isPending || batchMarkSent.isPending}
                selectable={batchMode}
                selected={selectedIds.has(n.id)}
                onSelectedChange={toggleSelected}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
