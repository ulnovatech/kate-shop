import { MAX_CATEGORY_DEPTH } from "@/lib/categories";
import { cn } from "@/lib/utils";

/** Fixed thread gutter so slug/status columns align at every depth. */
export const CATEGORY_THREAD_COL = `${(MAX_CATEGORY_DEPTH - 1) * 0.75}rem`;

export const CATEGORY_ROW_GRID_CLASS = cn(
  "grid items-center gap-x-3 px-3 py-2.5",
  "grid-cols-[var(--cat-thread)_1.25rem_1.75rem_minmax(0,1fr)]",
  "md:grid-cols-[var(--cat-thread)_1.25rem_1.75rem_minmax(0,1fr)_9rem_6.5rem]",
);

export const CATEGORY_HEADER_GRID_CLASS = cn(
  "grid items-center gap-x-3 border-b bg-secondary/40 px-3 py-2.5",
  "text-xs font-medium uppercase tracking-wider text-muted-foreground",
  "grid-cols-[var(--cat-thread)_1.25rem_1.75rem_minmax(0,1fr)]",
  "md:grid-cols-[var(--cat-thread)_1.25rem_1.75rem_minmax(0,1fr)_9rem_6.5rem]",
);

export const categoryListStyle = {
  ["--cat-thread" as string]: CATEGORY_THREAD_COL,
};

type ThreadCellProps = {
  depth: number;
  className?: string;
};

/** Reply-thread gutter with vertical guide for nested categories. */
export function CategoryThreadCell({ depth, className }: ThreadCellProps) {
  if (depth <= 1) {
    return <div className={cn("min-w-0", className)} aria-hidden />;
  }

  const indent = (depth - 2) * 0.75;

  return (
    <div
      className={cn("relative flex h-full min-h-[2.25rem] items-stretch", className)}
      style={{ paddingLeft: `${indent}rem` }}
      aria-hidden
    >
      <div className="relative ml-auto w-3 pr-1">
        <span className="absolute inset-y-1 right-0 w-px bg-border" />
        <span className="absolute right-0 top-1/2 h-px w-2 -translate-y-1/2 bg-border" />
      </div>
    </div>
  );
}
