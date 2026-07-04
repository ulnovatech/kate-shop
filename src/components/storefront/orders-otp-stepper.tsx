import { cn } from "@/lib/utils";
import { TRANSITION_COMMON_CLASS } from "@kate/ui/tokens";

const OTP_STEPS = [
  { id: 1, label: "Phone" },
  { id: 2, label: "Code" },
] as const;

export type OrdersOtpStepId = (typeof OTP_STEPS)[number]["id"];

type OrdersOtpStepperProps = {
  current: OrdersOtpStepId;
  className?: string;
};

export function OrdersOtpStepper({ current, className }: OrdersOtpStepperProps) {
  return (
    <nav aria-label="Verification progress" className={cn(className)}>
      <ol className="flex items-center gap-2">
        {OTP_STEPS.map((step, index) => {
          const done = current > step.id;
          const active = current === step.id;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-caption font-semibold",
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
              {index < OTP_STEPS.length - 1 ? (
                <div
                  className={cn(
                    "mb-5 h-px flex-1",
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

export function ordersOtpStepFromVerifyStep(step: "idle" | "otp-sent"): OrdersOtpStepId {
  return step === "otp-sent" ? 2 : 1;
}
