import { cn } from "@/lib/utils";
import { TRANSITION_COMMON_CLASS } from "@kate/ui/tokens";
import {
  ADMIN_ORDER_PIPELINE_STEPS,
  adminOrderPipelineStepIndex,
} from "@/lib/admin-order-pipeline";
import type { OrderStatus } from "@/lib/db/contracts";

type OrderPipelineStepperProps = {
  orderStatus: OrderStatus;
  paymentStatus: string;
  className?: string;
};

export function OrderPipelineStepper({
  orderStatus,
  paymentStatus,
  className,
}: OrderPipelineStepperProps) {
  const activeIndex = adminOrderPipelineStepIndex(orderStatus, paymentStatus);
  const cancelled = activeIndex === -1;
  const allDone = activeIndex >= ADMIN_ORDER_PIPELINE_STEPS.length;

  return (
    <nav aria-label="Order progress" className={cn(className)}>
      {cancelled ? (
        <p className="mb-3 text-sm text-destructive">This order was cancelled.</p>
      ) : null}
      <ol className="flex items-center gap-1 sm:gap-2">
        {ADMIN_ORDER_PIPELINE_STEPS.map((step, index) => {
          const done = !cancelled && (allDone || index < activeIndex);
          const active = !cancelled && !allDone && index === activeIndex;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
              <div className="flex min-w-0 flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-caption font-semibold sm:h-8 sm:w-8",
                    TRANSITION_COMMON_CLASS,
                    cancelled && "border-muted-foreground/20 text-muted-foreground",
                    !cancelled && done && "border-primary bg-primary text-primary-foreground",
                    !cancelled && active && "border-primary bg-primary/10 text-primary",
                    !cancelled && !done && !active && "border-muted-foreground/30 text-muted-foreground",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? "✓" : index + 1}
                </span>
                <span
                  className={cn(
                    "w-full truncate text-center type-overline",
                    cancelled && "text-muted-foreground",
                    !cancelled && (active || done) && "text-primary",
                    !cancelled && !active && !done && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < ADMIN_ORDER_PIPELINE_STEPS.length - 1 ? (
                <div
                  className={cn(
                    "mb-4 h-px flex-1 sm:mb-5",
                    TRANSITION_COMMON_CLASS,
                    !cancelled && (allDone || index < activeIndex) ? "bg-primary" : "bg-border",
                  )}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
