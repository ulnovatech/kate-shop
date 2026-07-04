import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatKES } from "@/lib/shop";
import type { DeliveryConfig } from "@/lib/delivery";

type DeliveryAreaPickerProps = {
  config: DeliveryConfig;
  value: string;
  onChange: (areaName: string) => void;
  id?: string;
  disabled?: boolean;
};

export function DeliveryAreaPicker({
  config,
  value,
  onChange,
  id,
  disabled,
}: DeliveryAreaPickerProps) {
  const [open, setOpen] = useState(false);

  const options = useMemo(
    () =>
      config.zones.flatMap((zone) =>
        zone.delivery_zone_areas.map((area) => ({
          areaName: area.area_name,
          zoneNumber: zone.zone_number,
          zoneFee: zone.fee,
        })),
      ),
    [config.zones],
  );

  const selected = options.find((o) => o.areaName === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="mt-1.5 h-11 w-full justify-between font-normal"
        >
          {selected ? (
            <span className="truncate">
              {selected.areaName}
              <span className="ml-2 text-muted-foreground">
                Zone {selected.zoneNumber} · {formatKES(selected.zoneFee)}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Search your area…</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Type area name…" />
          <CommandList>
            <CommandEmpty>No area found. Try a nearby neighbourhood.</CommandEmpty>
            {config.zones.map((zone) => (
              <CommandGroup
                key={zone.id}
                heading={`Zone ${zone.zone_number} — ${formatKES(zone.fee)}`}
              >
                {zone.delivery_zone_areas.map((area) => (
                  <CommandItem
                    key={area.id}
                    value={area.area_name}
                    onSelect={() => {
                      onChange(area.area_name);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === area.area_name ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {area.area_name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
