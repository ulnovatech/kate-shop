import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/** Large, high-contrast switch track for admin forms (overrides default h-5 w-9). */
export const adminSwitchClassName =
  "h-7 w-12 shrink-0 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/35 [&>span]:h-6 [&>span]:w-6 [&>span]:data-[state=checked]:translate-x-5 [&>span]:data-[state=unchecked]:translate-x-0";

type AdminToggleFieldProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function AdminToggleField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: AdminToggleFieldProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border px-4 py-3.5 transition-colors",
        checked ? "border-primary/45 bg-primary/5" : "border-border bg-muted/25",
        disabled && "opacity-60",
      )}
    >
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium leading-snug">
          {label}
        </Label>
        {description ? (
          <p className="mt-1 text-sm leading-snug text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wide",
            checked ? "text-primary" : "text-muted-foreground",
          )}
          aria-hidden
        >
          {checked ? "On" : "Off"}
        </span>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className={adminSwitchClassName}
          aria-label={label}
        />
      </div>
    </div>
  );
}
