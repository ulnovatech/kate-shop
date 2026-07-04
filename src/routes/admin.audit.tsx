import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuditListPage } from "@/components/admin/audit";
import { useListFilters } from "@/hooks/use-list-filters";
import {
  ADMIN_AUDIT_LIST_DEFAULTS,
  adminAuditListSearchSchema,
  parseAdminAuditListFilters,
  serializeAdminAuditListFilters,
} from "@/lib/list-filters";

export const Route = createFileRoute("/admin/audit")({
  staticData: { adminPermission: "audit" as const, adminRouteHeading: "Audit log" as const },
  validateSearch: (search) => adminAuditListSearchSchema.parse(search),
  component: AdminAudit,
});

function AdminAudit() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/audit" });

  const { applied, draft, setField, hasActiveFilters, clearFilters } = useListFilters({
    search,
    navigate,
    defaults: ADMIN_AUDIT_LIST_DEFAULTS,
    parse: parseAdminAuditListFilters,
    serialize: serializeAdminAuditListFilters,
  });

  return (
    <AuditListPage
      applied={applied}
      draft={draft}
      hasActiveFilters={hasActiveFilters}
      onQueryChange={(q) => setField("q", q)}
      onActionChange={(action) => setField("action", action)}
      onEntityChange={(entityType) => setField("entityType", entityType)}
      onDateFromChange={(dateFrom) => setField("dateFrom", dateFrom)}
      onDateToChange={(dateTo) => setField("dateTo", dateTo)}
      onClearFilters={clearFilters}
      onClearField={setField}
    />
  );
}
