import { createFileRoute } from "@tanstack/react-router";
import { PaymentsListPage } from "@/components/admin/payments";
import { useListFilters } from "@/hooks/use-list-filters";
import {
  ADMIN_PAYMENTS_LIST_DEFAULTS,
  adminPaymentsListSearchSchema,
  parseAdminPaymentsListFilters,
  serializeAdminPaymentsListFilters,
} from "@/lib/list-filters";

export const Route = createFileRoute("/_staff/payments")({
  staticData: { adminPermission: "orders" as const },
  validateSearch: (search) => adminPaymentsListSearchSchema.parse(search),
  component: AdminPayments,
});

function AdminPayments() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { applied, draft, setField, hasActiveFilters, clearFilters } = useListFilters({
    search,
    navigate,
    defaults: ADMIN_PAYMENTS_LIST_DEFAULTS,
    parse: parseAdminPaymentsListFilters,
    serialize: serializeAdminPaymentsListFilters,
  });

  return (
    <PaymentsListPage
      applied={applied}
      draft={draft}
      hasActiveFilters={hasActiveFilters}
      onQueryChange={(q) => setField("q", q)}
      onClearFilters={clearFilters}
    />
  );
}
