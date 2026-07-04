import { Link } from "@tanstack/react-router";
import { CheckCircle2, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  NOTIFICATION_EVENT_LABELS,
  NOTIFICATION_STATUS_LABELS,
  type NotificationEvent,
} from "@/lib/notifications";
import { formatPhoneDisplay } from "@/lib/phone";
import { whatsappUrl } from "@/lib/shop";
import { adminUrl } from "@/lib/admin-routes";
import { cn } from "@/lib/utils";

export const NOTIFICATION_LIST_GRID_CLASS =
  "md:grid md:grid-cols-[auto_minmax(0,1.2fr)_minmax(0,1fr)_auto] md:items-start md:gap-3";

export type NotificationListItem = {
  id: string;
  event_type: string;
  status: string;
  body: string;
  recipient_phone: string | null;
  order_id: string | null;
  created_at: string;
  sent_at: string | null;
  orders: { order_reference: string | null; customer_name: string } | null;
};

type NotificationRowProps = {
  notification: NotificationListItem;
  onMarkSent: (id: string) => void;
  markingSent: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelectedChange?: (id: string, selected: boolean) => void;
};

export function NotificationRow({
  notification: n,
  onMarkSent,
  markingSent,
  selectable = false,
  selected = false,
  onSelectedChange,
}: NotificationRowProps) {
  const order = n.orders;
  const event = n.event_type as NotificationEvent;
  const wa = n.recipient_phone ? whatsappUrl(n.body, n.recipient_phone) : null;
  const isPending = n.status === "pending";

  const copyBody = async () => {
    try {
      await navigator.clipboard.writeText(n.body);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <article
      className={cn(
        "border-b p-card last:border-b-0",
        "max-md:mx-3 max-md:mb-3 max-md:rounded-lg max-md:border max-md:border-border max-md:bg-card max-md:shadow-sm max-md:last:mb-0",
        NOTIFICATION_LIST_GRID_CLASS,
      )}
    >
      {selectable && isPending ? (
        <div className="mb-2 flex items-center gap-2 md:mb-0 md:items-start md:pt-0.5">
          <Checkbox
            id={`notif-select-${n.id}`}
            checked={selected}
            onCheckedChange={(checked) => onSelectedChange?.(n.id, checked === true)}
            aria-label={`Select notification for ${order?.customer_name ?? "customer"}`}
          />
        </div>
      ) : selectable ? (
        <div className="hidden md:block md:w-4" aria-hidden />
      ) : null}

      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="type-body-sm font-medium">{NOTIFICATION_EVENT_LABELS[event] ?? event}</p>
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 type-overline",
              isPending ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground",
            )}
          >
            {NOTIFICATION_STATUS_LABELS[n.status] ?? n.status}
          </span>
        </div>
        <p className="type-caption text-muted-foreground">
          {order?.order_reference ? (
            <span className="font-mono text-foreground">{order.order_reference} · </span>
          ) : null}
          {order?.customer_name ?? "Customer"}
          {n.recipient_phone ? <> · {formatPhoneDisplay(n.recipient_phone)}</> : null}
        </p>
        <p className="type-caption text-muted-foreground">
          {new Date(n.created_at).toLocaleString()}
          {n.sent_at ? ` · sent ${new Date(n.sent_at).toLocaleString()}` : ""}
        </p>
      </div>

      <p className="mt-stack whitespace-pre-wrap rounded-md bg-muted/40 p-3 type-body-sm md:mt-0">
        {n.body}
      </p>

      <div className="mt-stack flex flex-wrap gap-2 md:mt-0 md:justify-end">
        {n.order_id ? (
          <Button asChild variant="outline" size="sm">
            <Link to={adminUrl(`/orders/${n.order_id}`)}>View order</Link>
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={() => void copyBody()}>
          <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Copy
        </Button>
        {wa ? (
          <Button asChild size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90">
            <a href={wa} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden /> WhatsApp
            </a>
          </Button>
        ) : null}
        {isPending ? (
          <Button
            variant="outline"
            size="sm"
            disabled={markingSent}
            onClick={() => onMarkSent(n.id)}
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Mark sent
          </Button>
        ) : null}
      </div>
    </article>
  );
}
