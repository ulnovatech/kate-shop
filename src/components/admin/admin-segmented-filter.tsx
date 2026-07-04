import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { TRANSITION_COMMON_CLASS } from "@kate/ui/tokens";

export type SegmentedFilterOption<T extends string> = {
  value: T;
  label: string;
  /** Optional count badge */
  count?: number;
};

export type AdminSegmentedFilterProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedFilterOption<T>[];
  /** Accessible label for the filter group */
  ariaLabel: string;
  className?: string;
  size?: "sm" | "default";
};

export function AdminSegmentedFilter<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  size = "sm",
}: AdminSegmentedFilterProps<T>) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as T);
      }}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex shrink-0 rounded-lg border bg-muted/40 p-0.5",
        TRANSITION_COMMON_CLASS,
        className,
      )}
      size={size}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.count != null ? `${option.label} (${option.count})` : option.label}
          className={cn(
            "rounded-md px-3 text-body-sm data-[state=on]:bg-background data-[state=on]:shadow-sm",
            size === "sm" && "h-9 min-w-[4.5rem] px-2.5",
          )}
        >
          <span>{option.label}</span>
          {option.count != null ? (
            <span className="ml-1.5 text-caption text-muted-foreground tabular-nums">
              {option.count}
            </span>
          ) : null}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
