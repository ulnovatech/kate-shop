import type { NotificationEvent } from "@/lib/notifications";
import { previewNotificationTemplate } from "@/lib/notification-template-preview";
import { cn } from "@/lib/utils";

const EVENT_LABELS: Record<NotificationEvent, string> = {
  order_placed: "Customer receives",
  payment_confirmed: "After payment",
  order_shipped: "When shipped",
};

type NotificationTemplatePreviewProps = {
  event: NotificationEvent;
  template: string;
  className?: string;
};

export function NotificationTemplatePreview({
  event,
  template,
  className,
}: NotificationTemplatePreviewProps) {
  const preview = previewNotificationTemplate(event, template);

  return (
    <div
      className={cn(
        "rounded-md border border-dashed border-gold/30 bg-surface-muted/50 px-3 py-2.5",
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Preview · {EVENT_LABELS[event]}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground">{preview}</p>
    </div>
  );
}
