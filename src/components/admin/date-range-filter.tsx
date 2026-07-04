import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { adminToolbarControl } from "@/lib/admin-mobile";

type DateRangeFilterProps = {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  className?: string;
};

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  className,
}: DateRangeFilterProps) {
  const active = Boolean(from || to);
  const label = active ? [from, to].filter(Boolean).join(" – ") : "Date range";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(adminToolbarControl, "gap-1.5 px-2.5 md:gap-2 md:px-4", className)}
        >
          <Calendar className="h-4 w-4" aria-hidden />
          <span className="max-w-[10rem] truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3" align="start">
        <div>
          <Label htmlFor="date-range-from">From</Label>
          <Input
            id="date-range-from"
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="date-range-to">To</Label>
          <Input
            id="date-range-to"
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="mt-1.5"
          />
        </div>
        {active ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              onFromChange("");
              onToChange("");
            }}
          >
            Clear dates
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
