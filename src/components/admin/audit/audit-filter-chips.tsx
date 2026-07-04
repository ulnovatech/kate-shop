import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auditActionLabel, auditEntityLabel } from "@/lib/audit";
import type { AdminAuditListFilters } from "@/lib/list-filters";

type AuditFilterChipsProps = {
  applied: AdminAuditListFilters;
  onClearQuery: () => void;
  onClearAction: () => void;
  onClearEntity: () => void;
  onClearDateFrom: () => void;
  onClearDateTo: () => void;
  onClearAll: () => void;
};

type Chip = { id: string; label: string; onRemove: () => void };

function buildChips(props: AuditFilterChipsProps): Chip[] {
  const chips: Chip[] = [];

  if (props.applied.q.trim()) {
    chips.push({
      id: "q",
      label: `Search: ${props.applied.q.trim()}`,
      onRemove: props.onClearQuery,
    });
  }
  if (props.applied.action !== "all") {
    chips.push({
      id: "action",
      label: auditActionLabel(props.applied.action as never),
      onRemove: props.onClearAction,
    });
  }
  if (props.applied.entityType !== "all") {
    chips.push({
      id: "entity",
      label: auditEntityLabel(props.applied.entityType),
      onRemove: props.onClearEntity,
    });
  }
  if (props.applied.dateFrom) {
    chips.push({
      id: "from",
      label: `From ${props.applied.dateFrom}`,
      onRemove: props.onClearDateFrom,
    });
  }
  if (props.applied.dateTo) {
    chips.push({
      id: "to",
      label: `To ${props.applied.dateTo}`,
      onRemove: props.onClearDateTo,
    });
  }

  return chips;
}

export function AuditFilterChips(props: AuditFilterChipsProps) {
  const chips = buildChips(props);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-medium"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="rounded-full p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={`Remove ${chip.label}`}
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </span>
      ))}
      {chips.length > 1 ? (
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={props.onClearAll}>
          Clear all
        </Button>
      ) : null}
    </div>
  );
}
