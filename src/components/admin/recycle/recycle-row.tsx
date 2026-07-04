import { format } from "date-fns";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recycleEntityLabel, type RecycleEntityType } from "@/lib/recycle";
import { cn } from "@/lib/utils";

export const RECYCLE_LIST_GRID_CLASS =
  "md:grid md:grid-cols-[9rem_minmax(0,0.7fr)_minmax(0,1.2fr)_auto] md:items-center md:gap-3";

export type RecycleListItem = {
  id: string;
  entity_type: RecycleEntityType;
  name: string;
  slug: string;
  meta?: string | null;
  deleted_at: string;
};

type RecycleRowProps = {
  item: RecycleListItem;
  canPurge: boolean;
  busy: boolean;
  onRestore: () => void;
  onPurge: () => void;
};

export function RecycleRow({ item, canPurge, busy, onRestore, onPurge }: RecycleRowProps) {
  return (
    <article className={cn("border-b p-4 last:border-b-0", RECYCLE_LIST_GRID_CLASS)}>
      <p className="type-caption text-muted-foreground md:whitespace-nowrap">
        {format(new Date(item.deleted_at), "MMM d, yyyy HH:mm")}
      </p>
      <p className="type-body-sm">{recycleEntityLabel(item.entity_type)}</p>
      <div className="min-w-0">
        <p className="type-body-sm font-medium">{item.name}</p>
        <p className="font-mono type-caption text-muted-foreground">{item.slug}</p>
        {item.meta ? <p className="type-caption text-muted-foreground">{item.meta}</p> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 md:mt-0 md:justify-end">
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onRestore}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" aria-hidden />
          Restore
        </Button>
        {canPurge ? (
          <Button type="button" size="sm" variant="destructive" disabled={busy} onClick={onPurge}>
            <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden />
            Purge
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export function RecycleListHeader() {
  return (
    <header
      className={cn(
        "hidden border-b bg-muted/40 px-4 py-2.5 type-overline text-muted-foreground md:grid",
        RECYCLE_LIST_GRID_CLASS,
      )}
    >
      <span>Deleted</span>
      <span>Type</span>
      <span>Name</span>
      <span className="text-right">Actions</span>
    </header>
  );
}
