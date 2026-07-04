import { Link, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatKES } from "@/lib/shop";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatOrderStatus } from "@/lib/inventory";
import { PAYMENT_STATUS_LABELS } from "@/lib/payments";
import { adminUrl } from "@/lib/admin-routes";
import { cn } from "@/lib/utils";
import { LIST_ITEM_PERF_CLASS } from "@/lib/perf-perception";
import { SwipeableListRow } from "@/components/admin/swipeable-list-row";

export const ORDER_LIST_GRID_CLASS =
  "md:grid md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_6rem_auto] md:items-center md:gap-3";

export type AdminOrderListItem = {
  id: string;
  customer_name: string;
  phone: string;
  order_reference: string | null;
  created_at: string;
  order_status: string | null;
  payment_status: string;
  delivery_area?: string | null;
  grand_total?: number | null;
  total: number;
};

type OrderRowProps = {
  order: AdminOrderListItem;
  selectionMode?: boolean;
  selected?: boolean;
  onSelectedChange?: (id: string, selected: boolean) => void;
  onEnterSelectionMode?: (id: string) => void;
};

export function OrderRow({
  order,
  selectionMode = false,
  selected = false,
  onSelectedChange,
  onEnterSelectionMode,
}: OrderRowProps) {
  const navigate = useNavigate();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const displayStatus = order.order_status ?? "awaiting_payment";
  const total = order.grand_total ?? order.total;
  const detailPath = adminUrl(`/orders/${order.id}`);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const rowContent = (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b p-4 transition-common last:border-b-0 hover:bg-muted/30",
        LIST_ITEM_PERF_CLASS,
        ORDER_LIST_GRID_CLASS,
        selectionMode && selected && "bg-primary/5",
      )}
      onTouchStart={() => {
        if (selectionMode) return;
        longPressTimer.current = setTimeout(() => {
          onEnterSelectionMode?.(order.id);
        }, 500);
      }}
      onTouchEnd={clearLongPress}
      onTouchMove={clearLongPress}
    >
      {selectionMode ? (
        <div className="flex items-center md:items-start md:pt-0.5">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectedChange?.(order.id, checked === true)}
            aria-label={`Select order ${order.order_reference ?? order.customer_name}`}
          />
        </div>
      ) : (
        <div className="hidden md:block md:w-4" aria-hidden />
      )}

      <div className="min-w-0 flex-1 md:contents">
        <div className="min-w-0">
          {selectionMode ? (
            <p className="type-body-sm font-medium">{order.customer_name}</p>
          ) : (
            <Link to={detailPath} className="type-body-sm font-medium hover:text-primary">
              {order.customer_name}
            </Link>
          )}
          <p className="truncate type-caption text-muted-foreground">
            {order.order_reference ? (
              <span className="font-mono text-foreground">{order.order_reference} · </span>
            ) : null}
            {formatPhoneDisplay(order.phone)}
          </p>
          <p className="mt-1 type-caption text-muted-foreground md:hidden">
            {new Date(order.created_at).toLocaleDateString()} · {formatOrderStatus(displayStatus)}
          </p>
        </div>
      </div>

      <p className="hidden type-caption text-muted-foreground md:block">
        {new Date(order.created_at).toLocaleDateString()}
        <span className="mt-0.5 block">
          {formatOrderStatus(displayStatus)} ·{" "}
          {PAYMENT_STATUS_LABELS[order.payment_status as keyof typeof PAYMENT_STATUS_LABELS] ??
            order.payment_status}
          {order.delivery_area ? ` · ${order.delivery_area}` : ""}
        </span>
      </p>

      <p className="font-medium tabular-nums text-primary md:text-right">{formatKES(total)}</p>

      {selectionMode ? null : (
        <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground md:block" />
      )}
    </div>
  );

  if (selectionMode) {
    return rowContent;
  }

  return (
    <SwipeableListRow
      actions={[
        {
          id: "open",
          label: "Open",
          icon: <ExternalLink className="h-4 w-4" aria-hidden />,
          onClick: () => navigate({ to: detailPath }),
        },
      ]}
    >
      {rowContent}
    </SwipeableListRow>
  );
}

export function OrderListHeader({ selectionMode = false }: { selectionMode?: boolean }) {
  return (
    <header
      className={cn(
        "hidden border-b bg-muted/40 px-4 py-2.5 type-overline text-muted-foreground md:grid",
        ORDER_LIST_GRID_CLASS,
      )}
    >
      <span className="sr-only">{selectionMode ? "Select" : "Spacer"}</span>
      <span>Customer</span>
      <span>Status</span>
      <span className="text-right">Total</span>
      <span className="sr-only">Open</span>
    </header>
  );
}
