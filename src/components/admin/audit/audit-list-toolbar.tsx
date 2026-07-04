import {
  AdminListToolbar,
  OverlaySearch,
} from "@/components/admin";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUDIT_ACTIONS, auditActionLabel, auditEntityLabel } from "@/lib/audit";
import { AUDIT_ENTITY_TYPES,
  type AdminAuditListFilters,
  type AuditEntityFilter,
} from "@/lib/list-filters";
import { adminToolbarControl } from "@/lib/admin-mobile";
import { cn } from "@/lib/utils";

type AuditListToolbarProps = {
  draft: AdminAuditListFilters;
  onQueryChange: (q: string) => void;
  onActionChange: (action: string) => void;
  onEntityChange: (entity: AuditEntityFilter) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
};

export function AuditListToolbar({
  draft,
  onQueryChange,
  onActionChange,
  onEntityChange,
  onDateFromChange,
  onDateToChange,
}: AuditListToolbarProps) {
  return (
    <AdminListToolbar
      sticky
      search={
        <OverlaySearch
          value={draft.q}
          onChange={onQueryChange}
          searchLabel="Search audit log"
          placeholder="Entity id or type…"
          inputId="admin-audit-search"
        />
      }
    >
      <Select value={draft.action} onValueChange={onActionChange}>
        <SelectTrigger className={cn(adminToolbarControl, "w-[min(100%,9.5rem)]")}>
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All actions</SelectItem>
          {AUDIT_ACTIONS.map((a) => (
            <SelectItem key={a} value={a}>
              {auditActionLabel(a)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={draft.entityType} onValueChange={(v) => onEntityChange(v as AuditEntityFilter)}>
        <SelectTrigger className={cn(adminToolbarControl, "w-[min(100%,9rem)]")}>
          <SelectValue placeholder="Entity" />
        </SelectTrigger>
        <SelectContent>
          {AUDIT_ENTITY_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {t === "all" ? "All entities" : auditEntityLabel(t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangeFilter
        from={draft.dateFrom}
        to={draft.dateTo}
        onFromChange={onDateFromChange}
        onToChange={onDateToChange}
      />
    </AdminListToolbar>
  );
}
