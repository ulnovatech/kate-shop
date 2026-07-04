import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function CategoryStatusPill({
  hidden,
  onToggle,
  className,
}: {
  hidden: boolean;
  onToggle: (hidden: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-no-drag
      onClick={(e) => {
        e.stopPropagation();
        onToggle(!hidden);
      }}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors",
        "hover:ring-2 hover:ring-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        hidden ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary",
        className,
      )}
      aria-pressed={!hidden}
      aria-label={hidden ? "Show on storefront" : "Hide from storefront"}
    >
      {hidden ? (
        <>
          <EyeOff className="h-3 w-3" /> Hidden
        </>
      ) : (
        <>
          <Eye className="h-3 w-3" /> Visible
        </>
      )}
    </button>
  );
}
