import { format } from "date-fns";
import type { AuditLogListItem } from "@/lib/api/audit.functions";
import { auditActionLabel, auditEntityLabel, formatAuditPayloadSummary } from "@/lib/audit";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function auditLogsToCsv(rows: AuditLogListItem[]): string {
  const headers = ["when", "actor", "action", "entity_type", "entity_id", "summary"];

  const lines = rows.map((row) =>
    [
      format(new Date(row.created_at), "yyyy-MM-dd HH:mm:ss"),
      row.actor_email ?? "System",
      auditActionLabel(row.action),
      auditEntityLabel(row.entity_type),
      row.entity_id ?? "",
      formatAuditPayloadSummary(row),
    ]
      .map((v) => escapeCsv(String(v)))
      .join(","),
  );

  return [headers.join(","), ...lines].join("\n");
}
