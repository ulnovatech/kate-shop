import { createFileRoute } from "@tanstack/react-router";
import { OrderListPage } from "@/components/admin/orders";
import { useListFilters } from "@/hooks/use-list-filters";
import {
  ADMIN_ORDER_LIST_DEFAULTS,
  adminOrderListSearchSchema,
  parseAdminOrderListFilters,
  serializeAdminOrderListFilters,
} from "@/lib/list-filters";

export const Route = createFileRoute("/_staff/orders")({
  staticData: { adminPermission: "orders" as const },
  validateSearch: (search) => adminOrderListSearchSchema.parse(search),
  component: AdminOrders,
});

function AdminOrders() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { applied, draft, setField, patchDraft, hasActiveFilters, clearFilters } = useListFilters({
    search,
    navigate,
    defaults: ADMIN_ORDER_LIST_DEFAULTS,
    parse: parseAdminOrderListFilters,
    serialize: serializeAdminOrderListFilters,
    resetPageKey: "page",
  });

  return (
    <OrderListPage
      applied={applied}
      draft={draft}
      hasActiveFilters={hasActiveFilters}
      onQueryChange={(q) => setField("q", q)}
      onStatusChange={(status) => setField("status", status)}
      onDateFromChange={(dateFrom) => setField("dateFrom", dateFrom)}
      onDateToChange={(dateTo) => setField("dateTo", dateTo)}
      onPageChange={(page) => setField("page", page)}
      onApplySavedView={(filters) => patchDraft(filters, { immediate: true })}
      onClearField={setField}
      onClearFilters={clearFilters}
    />
  );
}
