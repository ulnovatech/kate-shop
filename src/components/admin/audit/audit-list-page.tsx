import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Download, SearchX } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { DataTableSkeleton } from "@/components/loading-states";
import { listAuditLogs } from "@/lib/api/audit.functions";
import { useAuth } from "@/lib/auth";
import { auditLogsToCsv } from "@/lib/audit-export";
import { downloadTextFile } from "@/lib/download-text";
import {
  buildListQueryKey,
  type AdminAuditListFilters,
  type AuditEntityFilter,
} from "@/lib/list-filters";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { AuditListHeader, AuditRow } from "./audit-row";
import { AuditFilterChips } from "./audit-filter-chips";
import { AuditListToolbar } from "./audit-list-toolbar";

type AuditListPageProps = {
  applied: AdminAuditListFilters;
  draft: AdminAuditListFilters;
  hasActiveFilters: boolean;
  onQueryChange: (q: string) => void;
  onActionChange: (action: string) => void;
  onEntityChange: (entity: AuditEntityFilter) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClearFilters: () => void;
  onClearField: (field: keyof AdminAuditListFilters, value: AdminAuditListFilters[keyof AdminAuditListFilters]) => void;
};

export function AuditListPage({
  applied,
  draft,
  hasActiveFilters,
  onQueryChange,
  onActionChange,
  onEntityChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  onClearField,
}: AuditListPageProps) {
  const { permissions } = useAuth();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: buildListQueryKey("admin-audit", applied),
    queryFn: () =>
      listAuditLogs({
        data: {
          query: applied.q || undefined,
          action: applied.action === "all" ? undefined : applied.action,
          entity_type: applied.entityType === "all" ? undefined : applied.entityType,
          date_from: applied.dateFrom || undefined,
          date_to: applied.dateTo || undefined,
          limit: 100,
        },
      }),
  });

  const exportCsv = () => {
    if (logs.length === 0) return;
    const csv = auditLogsToCsv(logs);
    downloadTextFile(`audit-log-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success("CSV downloaded");
  };

  return (
    <div className="space-y-section">
      <AdminPageHeader
        title="Audit log"
        description={
          permissions.canManageSettings
            ? "Full activity history for products, orders, payments, settings, and team."
            : "Operational activity — orders, payments, catalog, and inventory."
        }
        meta={isLoading ? "Loading…" : `${logs.length} entries`}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={adminPrimaryTouch}
            disabled={isLoading || logs.length === 0}
            onClick={exportCsv}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden />
            Export CSV
          </Button>
        }
      />

      <AuditListToolbar
        draft={draft}
        onQueryChange={onQueryChange}
        onActionChange={onActionChange}
        onEntityChange={onEntityChange}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
      />

      <AuditFilterChips
        applied={applied}
        onClearQuery={() => onClearField("q", "")}
        onClearAction={() => onClearField("action", "all")}
        onClearEntity={() => onClearField("entityType", "all")}
        onClearDateFrom={() => onClearField("dateFrom", "")}
        onClearDateTo={() => onClearField("dateTo", "")}
        onClearAll={onClearFilters}
      />

      <div className="overflow-hidden rounded-lg border bg-card shadow-elevated">
        {isLoading ? (
          <div className="p-4">
            <DataTableSkeleton rows={8} cols={5} />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-card">
            {hasActiveFilters ? (
              <EmptyState
                illustration="search"
                icon={SearchX}
                title="No audit entries match"
                description="Try different filters or a broader date range."
                primaryAction={{ label: "Clear filters", onClick: onClearFilters }}
              />
            ) : (
              <EmptyState
                illustration="audit"
                icon={ClipboardList}
                title="No activity yet"
                description="Changes to products, orders, and settings will be recorded here."
              />
            )}
          </div>
        ) : (
          <>
            <AuditListHeader />
            <div role="list">
              {logs.map((row) => (
                <AuditRow key={row.id} row={row} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
