import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, SearchX } from "lucide-react";
import { AdminListToolbar, AdminPageHeader, OverlaySearch } from "@/components/admin";
import { EmptyState } from "@/components/empty-state";
import { CardListSkeleton } from "@/components/loading-states";
import { searchUnpaidOrders } from "@/lib/api/payments.functions";
import { listCheckoutPaymentMethods } from "@/lib/api/payment-methods.functions";
import type { PaymentProvider } from "@/lib/db/contracts";
import { buildListQueryKey, type AdminPaymentsListFilters } from "@/lib/list-filters";
import { UnpaidOrderRow } from "./unpaid-order-row";

type PaymentsListPageProps = {
  applied: AdminPaymentsListFilters;
  draft: AdminPaymentsListFilters;
  hasActiveFilters: boolean;
  onQueryChange: (q: string) => void;
  onClearFilters: () => void;
};

export function PaymentsListPage({
  applied,
  draft,
  hasActiveFilters,
  onQueryChange,
  onClearFilters,
}: PaymentsListPageProps) {
  const qc = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: buildListQueryKey("admin-unpaid-orders", applied),
    queryFn: () => searchUnpaidOrders({ data: { query: applied.q || undefined } }),
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["checkout-payment-methods"],
    queryFn: () => listCheckoutPaymentMethods(),
    staleTime: 60_000,
  });

  const enabledProviders = paymentMethods.map((m) => m.provider) as PaymentProvider[];

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-unpaid-orders"] });
    void qc.invalidateQueries({ queryKey: ["admin-orders"] });
    void qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  return (
    <div className="space-y-section">
      <AdminPageHeader
        title="Confirm payments"
        description="Find the order, enter payment details, and confirm — three steps to record MoMo payments."
        meta={
          isLoading
            ? "Loading…"
            : `${orders.length} unpaid ${orders.length === 1 ? "order" : "orders"}`
        }
      />

      <AdminListToolbar
        sticky
        search={
          <OverlaySearch
            value={draft.q}
            onChange={onQueryChange}
            searchLabel="Search unpaid orders"
            placeholder="Reference, phone, name…"
            inputId="admin-payments-search"
          />
        }
      />

      <div className="overflow-hidden rounded-lg border bg-card shadow-elevated">
        {isLoading ? (
          <div className="p-4">
            <CardListSkeleton rows={4} />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-card">
            {hasActiveFilters ? (
              <EmptyState
                illustration="search"
                icon={SearchX}
                title="No matches"
                description={`Nothing matched your search. Try the order reference or phone number.`}
                primaryAction={{ label: "Clear search", onClick: onClearFilters }}
              />
            ) : (
              <EmptyState
                illustration="orders"
                icon={CheckCircle2}
                title="No unpaid orders"
                description="All caught up — every active order is paid or awaiting stock confirmation."
              />
            )}
          </div>
        ) : (
          <div role="list">
            {orders.map((order) => (
              <UnpaidOrderRow
                key={order.id}
                order={order}
                enabledProviders={enabledProviders}
                onPaymentRecorded={refresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
