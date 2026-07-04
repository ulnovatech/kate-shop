import { CHECKOUT_WIZARD_STEPS, type CheckoutWizardStepId } from "@/lib/checkout-steps";
import { cn } from "@/lib/utils";
import { TRANSITION_COMMON_CLASS } from "@kate/ui/tokens";

type CheckoutWizardStepperProps = {
  current: CheckoutWizardStepId;
  className?: string;
};

export function CheckoutWizardStepper({ current, className }: CheckoutWizardStepperProps) {
  return (
    <nav aria-label="Checkout progress" className={cn("lg:hidden", className)}>
      <ol className="flex items-center gap-1 sm:gap-2">
        {CHECKOUT_WIZARD_STEPS.map((step, index) => {
          const done = current > step.id;
          const active = current === step.id;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
              <div className="flex min-w-0 flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-caption font-semibold sm:h-8 sm:w-8",
                    TRANSITION_COMMON_CLASS,
                    done && "border-primary bg-primary text-primary-foreground",
                    active && "border-primary bg-primary/10 text-primary",
                    !done && !active && "border-muted-foreground/30 text-muted-foreground",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? "✓" : step.id}
                </span>
                <span
                  className={cn(
                    "w-full truncate text-center type-overline",
                    active || done ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < CHECKOUT_WIZARD_STEPS.length - 1 ? (
                <div
                  className={cn(
                    "mb-4 h-px flex-1 sm:mb-5",
                    TRANSITION_COMMON_CLASS,
                    current > step.id ? "bg-primary" : "bg-border",
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

/** Vertical checkout stepper for desktop layouts */
export function CheckoutWizardStepperSidebar({
  current,
  className,
}: CheckoutWizardStepperProps) {
  return (
    <nav aria-label="Checkout progress" className={cn("hidden lg:block", className)}>
      <ol className="space-y-1">
        {CHECKOUT_WIZARD_STEPS.map((step) => {
          const done = current > step.id;
          const active = current === step.id;
          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 type-body-sm",
                active && "bg-primary/10 font-medium text-primary",
                done && !active && "text-muted-foreground",
                !done && !active && "text-muted-foreground",
              )}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-caption font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary text-primary",
                  !done && !active && "border-muted-foreground/30",
                )}
              >
                {done ? "✓" : step.id}
              </span>
              {step.label}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
