import {
  AdminListToolbar,
  OverlaySearch,
} from "@/components/admin";
import { AdminSavedViewsMenu } from "@/components/admin/admin-saved-views-menu";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORDER_LIST_PRESETS } from "@/lib/admin-list-presets";
import { SAVED_LIST_VIEW_KEYS } from "@/lib/saved-list-views";
import { ADMIN_ORDER_STATUS_OPTIONS } from "@/lib/inventory";
import { adminToolbarControl } from "@/lib/admin-mobile";
import type { AdminOrderListFilters } from "@/lib/list-filters";
import type { OrderStatus } from "@/lib/db/contracts";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: AdminOrderListFilters["status"]; label: string }[] = [
  { value: "all", label: "All" },
  ...ADMIN_ORDER_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
];

type OrderListToolbarProps = {
  draft: AdminOrderListFilters;
  onQueryChange: (q: string) => void;
  onStatusChange: (status: AdminOrderListFilters["status"]) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onApplySavedView: (filters: AdminOrderListFilters) => void;
};

export function OrderListToolbar({
  draft,
  onQueryChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onApplySavedView,
}: OrderListToolbarProps) {
  return (
    <AdminListToolbar
      sticky
      search={
        <OverlaySearch
          value={draft.q}
          onChange={onQueryChange}
          searchLabel="Search orders"
          placeholder="Reference, name, or phone…"
          inputId="admin-orders-search"
        />
      }
      trailing={
        <AdminSavedViewsMenu
          storageKey={SAVED_LIST_VIEW_KEYS.adminOrders}
          currentFilters={draft}
          presets={ORDER_LIST_PRESETS}
          onApply={onApplySavedView}
        />
      }
    >
      <Select
        value={draft.status}
        onValueChange={(v) => onStatusChange(v as OrderStatus | "all")}
      >
        <SelectTrigger
          className={cn(adminToolbarControl, "w-[min(100%,11rem)]")}
          aria-label="Order status"
        >
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DateRangeFilter
        from={draft.dateFrom}
        to={draft.dateTo}
        onFromChange={onDateFromChange}
        onToChange={onDateToChange}
      />
    </AdminListToolbar>
  );
}
