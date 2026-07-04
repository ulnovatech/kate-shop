import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Package, SearchX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminBulkActionBar, AdminPageHeader } from "@/components/admin";
import { AdminFilterChips } from "@/components/admin/admin-filter-chips";
import { EmptyState } from "@/components/empty-state";
import { ListPaginationFooter } from "@/components/list-pagination-footer";
import { CardListSkeleton, InlineCountLoader } from "@/components/loading-states";
import { useListSelection } from "@/hooks/use-list-selection";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { buildOrderFilterChips } from "@/lib/admin-order-filter-chips";
import { listAdminOrders, exportAdminOrdersCsv } from "@/lib/api/orders.functions";
import {
  adminOrderFiltersToApi,
  buildListQueryKey,
  type AdminOrderListFilters,
} from "@/lib/list-filters";
import { humanizeError } from "@/lib/errors";
import { downloadTextFile } from "@/lib/download-text";
import { ordersToCsv, type OrderCsvRow } from "@/lib/orders";
import { DEFAULT_LIST_PAGE_SIZE } from "@kate/api/list-pagination";
import { OrderListHeader, OrderRow, type AdminOrderListItem } from "./order-row";
import { OrderListToolbar } from "./order-list-toolbar";

type OrderListPageProps = {
  applied: AdminOrderListFilters;
  draft: AdminOrderListFilters;
  hasActiveFilters: boolean;
  onQueryChange: (q: string) => void;
  onStatusChange: (status: AdminOrderListFilters["status"]) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onApplySavedView: (filters: AdminOrderListFilters) => void;
  onClearField: <K extends keyof AdminOrderListFilters>(
    key: K,
    value: AdminOrderListFilters[K],
  ) => void;
  onClearFilters: () => void;
};

export function OrderListPage({
  applied,
  draft,
  hasActiveFilters,
  onQueryChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onPageChange,
  onApplySavedView,
  onClearField,
  onClearFilters,
}: OrderListPageProps) {
  const { data: pageResult, isLoading } = useQuery({
    queryKey: buildListQueryKey("admin-orders", applied),
    queryFn: async () => {
      const result = await listAdminOrders({ data: adminOrderFiltersToApi(applied) });
      if (Array.isArray(result)) {
        return {
          items: result as AdminOrderListItem[],
          page: 1,
          pageSize: result.length,
          total: result.length,
          totalPages: 1,
        };
      }
      return {
        items: result.items as AdminOrderListItem[],
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      };
    },
    placeholderData: (previous) => previous,
  });

  const orders = pageResult?.items ?? [];
  const total = pageResult?.total ?? 0;
  const totalPages = pageResult?.totalPages ?? 0;

  const filterChips = useMemo(
    () =>
      buildOrderFilterChips(applied, {
        onClearQuery: () => onClearField("q", ""),
        onClearStatus: () => onClearField("status", "all"),
        onClearDateFrom: () => onClearField("dateFrom", ""),
        onClearDateTo: () => onClearField("dateTo", ""),
      }),
    [applied, onClearField],
  );

  const orderIds = useMemo(() => orders.map((o) => o.id), [orders]);
  const selection = useListSelection(orderIds);
  const selectedOrders = useMemo(
    () => orders.filter((o) => selection.selectedIds.has(o.id)),
    [orders, selection.selectedIds],
  );

  const exportSelectedCsv = () => {
    if (selectedOrders.length === 0) return;
    const csv = ordersToCsv(
      selectedOrders.map(
        (o): OrderCsvRow => ({
          order_reference: o.order_reference,
          customer_name: o.customer_name,
          phone: o.phone,
          order_status: o.order_status,
          payment_status: o.payment_status,
          grand_total: o.grand_total ?? null,
          total: o.total,
          delivery_area: o.delivery_area ?? null,
          created_at: o.created_at,
        }),
      ),
    );
    downloadTextFile(`store-orders-selected-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success("CSV downloaded");
  };

  const exportAllCsv = async () => {
    try {
      const { csv } = await exportAdminOrdersCsv({ data: adminOrderFiltersToApi(applied) });
      downloadTextFile(`store-orders-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      toast.success("CSV downloaded");
    } catch (e: unknown) {
      toast.error(humanizeError(e, { fallback: "Could not export orders." }));
    }
  };

  return (
    <div className="space-y-section">
      <AdminPageHeader
        title="Orders"
        meta={
          isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <InlineCountLoader />
              Fetching orders…
            </span>
          ) : (
            `${total} ${total === 1 ? "order" : "orders"}`
          )
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {orders.length > 0 ? (
              <Button
                type="button"
                variant={selection.selectionMode ? "secondary" : "outline"}
                className={adminPrimaryTouch}
                onClick={() => selection.toggleSelectionMode()}
              >
                {selection.selectionMode ? "Done selecting" : "Select"}
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => void exportAllCsv()}
              disabled={orders.length === 0}
              className={adminPrimaryTouch}
            >
              <Download className="mr-2 h-4 w-4" aria-hidden />
              Export CSV
            </Button>
          </div>
        }
      />

      <OrderListToolbar
        draft={draft}
        onQueryChange={onQueryChange}
        onStatusChange={onStatusChange}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
        onApplySavedView={onApplySavedView}
      />

      <AdminFilterChips chips={filterChips} onClearAll={onClearFilters} />

      {selection.selectionMode ? (
        <AdminBulkActionBar
          active={selection.selectionMode}
          selectedCount={selection.selectedCount}
          totalOnPage={orders.length}
          allOnPageSelected={selection.allOnPageSelected}
          onSelectAll={selection.toggleAllOnPage}
          onClearSelection={selection.clearSelection}
        >
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={selectedOrders.length === 0}
            onClick={exportSelectedCsv}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Export selected
          </Button>
        </AdminBulkActionBar>
      ) : null}

      <div className="overflow-hidden rounded-lg border bg-card shadow-elevated">
        {isLoading ? (
          <div className="p-4">
            <CardListSkeleton rows={5} />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-card">
            {hasActiveFilters ? (
              <EmptyState
                illustration="search"
                icon={SearchX}
                title="No orders match your filters"
                description="Try a different search, status, or date range."
                primaryAction={{ label: "Clear filters", onClick: onClearFilters }}
              />
            ) : (
              <EmptyState
                illustration="orders"
                icon={Package}
                title="No orders yet"
                description="Orders from your shop will appear here when customers check out."
              />
            )}
          </div>
        ) : (
          <>
            <OrderListHeader selectionMode={selection.selectionMode} />
            <div role="list">
              {orders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  selectionMode={selection.selectionMode}
                  selected={selection.selectedIds.has(order.id)}
                  onSelectedChange={selection.toggleSelected}
                  onEnterSelectionMode={selection.enterSelectionWith}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ListPaginationFooter
        page={applied.page}
        totalPages={totalPages}
        total={total}
        pageSize={DEFAULT_LIST_PAGE_SIZE}
        onPageChange={onPageChange}
      />
    </div>
  );
}
