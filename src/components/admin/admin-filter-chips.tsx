import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type FilterChip = {
  id: string;
  label: string;
  onRemove: () => void;
};

type AdminFilterChipsProps = {
  chips: FilterChip[];
  onClearAll?: () => void;
};

export function AdminFilterChips({ chips, onClearAll }: AdminFilterChipsProps) {
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
      {chips.length > 1 && onClearAll ? (
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClearAll}>
          Clear all
        </Button>
      ) : null}
    </div>
  );
}
