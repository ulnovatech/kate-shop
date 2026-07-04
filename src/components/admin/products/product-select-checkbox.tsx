import { Check } from "lucide-react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";

type ProductSelectCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  "aria-label": string;
  className?: string;
};

/** Product list selection — green box, white tick, right-aligned in rows. */
export function ProductSelectCheckbox({
  checked,
  onCheckedChange,
  "aria-label": ariaLabel,
  className,
}: ProductSelectCheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      onCheckedChange={(value) => onCheckedChange(value === true)}
      aria-label={ariaLabel}
      className={cn(
        "grid h-6 w-6 shrink-0 place-content-center rounded-md border-2 shadow-sm transition-colors",
        "border-muted-foreground/35 bg-background",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        "data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white",
        className,
      )}
    >
      <CheckboxPrimitive.Indicator className="grid place-content-center text-current">
        <Check className="h-4 w-4 stroke-[3]" aria-hidden />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
