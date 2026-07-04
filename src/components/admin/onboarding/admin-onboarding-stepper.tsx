import { cn } from "@/lib/utils";
import { TRANSITION_COMMON_CLASS } from "@kate/ui/tokens";

export type OnboardingStep = {
  id: string;
  label: string;
};

type AdminOnboardingStepperProps = {
  steps: OnboardingStep[];
  current: string;
  className?: string;
};

function stepIndex(steps: OnboardingStep[], id: string): number {
  return steps.findIndex((s) => s.id === id);
}

export function AdminOnboardingStepper({ steps, current, className }: AdminOnboardingStepperProps) {
  const currentIndex = stepIndex(steps, current);
  const resolvedIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <nav aria-label="Setup progress" className={cn("mb-stack-lg", className)}>
      <ol className="flex items-center gap-1">
        {steps.map((step, index) => {
          const done = index < resolvedIndex;
          const active = index === resolvedIndex;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1">
              <div className="flex min-w-0 flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-caption font-semibold",
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
                    "hidden w-full truncate text-center type-overline sm:block",
                    active || done ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <div
                  className={cn(
                    "mb-4 h-px flex-1",
                    index < resolvedIndex ? "bg-primary" : "bg-border",
                  )}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-center type-caption text-muted-foreground sm:hidden">
        Step {resolvedIndex + 1} of {steps.length}: {steps[resolvedIndex]?.label}
      </p>
    </nav>
  );
}
