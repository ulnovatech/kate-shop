import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_TRACKING_STEPS, humanOrderStatus, orderTrackingStepIndex } from "@/lib/human-labels";

type OrderStatusTrackerProps = {
  orderStatus: string;
  paymentStatus: string;
};

export function OrderStatusTracker({ orderStatus, paymentStatus }: OrderStatusTrackerProps) {
  if (orderStatus === "cancelled") {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        This order was cancelled.
      </div>
    );
  }

  const activeIndex = orderTrackingStepIndex(orderStatus, paymentStatus);

  return (
    <div className="rounded-md border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">Order status</h2>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {humanOrderStatus(orderStatus)}
        </span>
      </div>
      <ol className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ORDER_TRACKING_STEPS.map((step, index) => {
          const done = index < activeIndex;
          const current = index === activeIndex;
          return (
            <li key={step.key} className="flex items-start gap-2 text-sm">
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                  done && "border-primary bg-primary text-primary-foreground",
                  current && "border-gold bg-gold/15 text-primary",
                  !done && !current && "border-border text-muted-foreground",
                )}
                aria-hidden
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "leading-snug",
                  current ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
