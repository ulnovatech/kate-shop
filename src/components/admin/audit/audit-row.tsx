import { format } from "date-fns";
import { auditActionLabel, auditEntityLabel, formatAuditPayloadSummary } from "@/lib/audit";
import type { AuditLogListItem } from "@/lib/api/audit.functions";
import { cn } from "@/lib/utils";

export const AUDIT_LIST_GRID_CLASS =
  "md:grid md:grid-cols-[9rem_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,1fr)] md:items-start md:gap-3";

export { formatAuditPayloadSummary };

export function AuditRow({ row }: { row: AuditLogListItem }) {
  return (
    <article className={cn("border-b p-4 last:border-b-0", AUDIT_LIST_GRID_CLASS)}>
      <p className="type-caption text-muted-foreground md:whitespace-nowrap">
        {format(new Date(row.created_at), "MMM d, yyyy HH:mm")}
      </p>
      <p className="type-body-sm">{row.actor_email ?? "System"}</p>
      <p className="type-body-sm">{auditActionLabel(row.action)}</p>
      <div className="type-body-sm">
        {auditEntityLabel(row.entity_type)}
        {row.entity_id ? (
          <span className="mt-0.5 block font-mono type-caption text-muted-foreground">
            {row.entity_id.length > 24 ? `${row.entity_id.slice(0, 24)}…` : row.entity_id}
          </span>
        ) : null}
      </div>
      <p className="type-body-sm text-muted-foreground">{formatAuditPayloadSummary(row)}</p>
    </article>
  );
}

export function AuditListHeader() {
  return (
    <header
      className={cn(
        "hidden border-b bg-muted/40 px-4 py-2.5 type-overline text-muted-foreground md:grid",
        AUDIT_LIST_GRID_CLASS,
      )}
    >
      <span>When</span>
      <span>Actor</span>
      <span>Action</span>
      <span>Entity</span>
      <span>Summary</span>
    </header>
  );
}
