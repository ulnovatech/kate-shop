import { cn } from "@/lib/utils";
import { TRANSITION_COMMON_CLASS } from "@kate/ui/tokens";

export type WizardStep = {
  id: string | number;
  label: string;
};

export type AdminWizardStepperProps = {
  steps: WizardStep[];
  current: string | number;
  className?: string;
  /** Hide on large screens when shell shows sidebar stepper */
  hideFrom?: "lg" | "md" | "never";
  /** Smaller step indicators for modal wizards */
  compact?: boolean;
};

function stepIndex(steps: WizardStep[], id: string | number): number {
  return steps.findIndex((s) => s.id === id);
}

export function AdminWizardStepper({
  steps,
  current,
  className,
  hideFrom = "never",
  compact = false,
}: AdminWizardStepperProps) {
  const currentIndex = stepIndex(steps, current);
  const resolvedIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <nav
      aria-label="Progress"
      className={cn(
        hideFrom === "lg" && "lg:hidden",
        hideFrom === "md" && "md:hidden",
        className,
      )}
    >
      <ol className={cn("flex items-center", compact ? "gap-1" : "gap-2")}>
        {steps.map((step, index) => {
          const done = index < resolvedIndex;
          const active = index === resolvedIndex;
          return (
            <li key={String(step.id)} className="flex min-w-0 flex-1 items-center gap-2">
              <div className={cn("flex min-w-0 flex-col items-center", compact ? "gap-1" : "gap-1.5")}>
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full border font-semibold",
                    compact ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-caption",
                    TRANSITION_COMMON_CLASS,
                    done && "border-primary bg-primary text-primary-foreground",
                    active && "border-primary bg-primary/10 text-primary",
                    !done && !active && "border-muted-foreground/30 text-muted-foreground",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? "✓" : index + 1}
                </span>
                <span
                  className={cn(
                    "w-full truncate text-center",
                    compact ? "type-caption text-[10px] leading-tight" : "type-overline",
                    active || done ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <div
                  className={cn(
                    "h-px flex-1",
                    compact ? "mb-4" : "mb-5",
                    TRANSITION_COMMON_CLASS,
                    index < resolvedIndex ? "bg-primary" : "bg-border",
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

/** Vertical stepper for desktop wizard layouts */
export function AdminWizardStepperSidebar({
  steps,
  current,
  className,
}: Omit<AdminWizardStepperProps, "hideFrom">) {
  const currentIndex = stepIndex(steps, current);
  const resolvedIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <nav aria-label="Progress" className={cn("hidden lg:block", className)}>
      <ol className="space-y-1">
        {steps.map((step, index) => {
          const done = index < resolvedIndex;
          const active = index === resolvedIndex;
          return (
            <li
              key={String(step.id)}
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
                {done ? "✓" : index + 1}
              </span>
              {step.label}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
