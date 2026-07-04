import type { FilterChip } from "@/components/admin/admin-filter-chips";
import { formatOrderStatus } from "@/lib/inventory";
import type { AdminOrderListFilters } from "@/lib/list-filters";
import { ADMIN_ORDER_LIST_DEFAULTS } from "@/lib/list-filters";

type OrderFilterChipHandlers = {
  onClearQuery: () => void;
  onClearStatus: () => void;
  onClearDateFrom: () => void;
  onClearDateTo: () => void;
};

export function buildOrderFilterChips(
  applied: AdminOrderListFilters,
  handlers: OrderFilterChipHandlers,
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (applied.q.trim()) {
    chips.push({ id: "q", label: `Search: ${applied.q.trim()}`, onRemove: handlers.onClearQuery });
  }
  if (applied.status !== ADMIN_ORDER_LIST_DEFAULTS.status) {
    chips.push({
      id: "status",
      label: formatOrderStatus(applied.status),
      onRemove: handlers.onClearStatus,
    });
  }
  if (applied.dateFrom) {
    chips.push({ id: "from", label: `From ${applied.dateFrom}`, onRemove: handlers.onClearDateFrom });
  }
  if (applied.dateTo) {
    chips.push({ id: "to", label: `To ${applied.dateTo}`, onRemove: handlers.onClearDateTo });
  }

  return chips;
}
