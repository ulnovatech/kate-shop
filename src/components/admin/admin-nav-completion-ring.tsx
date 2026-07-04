import { cn } from "@/lib/utils";

type AdminNavCompletionRingProps = {
  complete: boolean;
  className?: string;
  /** Visually hidden label for screen readers */
  label: string;
};

/**
 * Small ring on nav icons — dashed gold when incomplete, solid emerald when done.
 */
export function AdminNavCompletionRing({
  complete,
  className,
  label,
}: AdminNavCompletionRingProps) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute -inset-1 rounded-md border-2",
        complete ? "border-emerald-400/70" : "border-gold/55 border-dashed",
        className,
      )}
      aria-hidden
    >
      <span className="sr-only">{complete ? `${label} complete` : `${label} needs setup`}</span>
    </span>
  );
}
