import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { adminPrimaryTouch, adminToolbarControl } from "@/lib/admin-mobile";
import { TYPOGRAPHY_TAILWIND } from "@kate/ui/tokens";
import {
  AdminWizardStepper,
  AdminWizardStepperSidebar,
  type WizardStep,
} from "./admin-wizard-stepper";

export type { WizardStep };

export type AdminWizardShellProps = {
  steps: WizardStep[];
  currentStep: string | number;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
  backLabel?: string;
  nextLabel?: string;
  finishLabel?: string;
  cancelLabel?: string;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  busy?: boolean;
  nextDisabled?: boolean;
  finishDisabled?: boolean;
  footerExtra?: ReactNode;
  className?: string;
  /** Page = full route layout; modal = compact centered wizard dialog */
  variant?: "page" | "modal";
};

export function AdminWizardShell({
  steps,
  currentStep,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  onFinish,
  onCancel,
  backLabel = "Back",
  nextLabel = "Continue",
  finishLabel = "Save",
  cancelLabel = "Cancel",
  isFirstStep = false,
  isLastStep = false,
  busy = false,
  nextDisabled = false,
  finishDisabled = false,
  footerExtra,
  className,
  variant = "page",
}: AdminWizardShellProps) {
  const showBack = !isFirstStep && onBack;
  const primaryAction = isLastStep ? onFinish : onNext;
  const primaryLabel = isLastStep ? finishLabel : nextLabel;
  const primaryDisabled = isLastStep ? finishDisabled : nextDisabled;
  const isModal = variant === "modal";

  const footer = (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2",
        isModal ? "border-t px-4 py-3" : "gap-inline-sm",
      )}
    >
      {footerExtra && !isModal ? (
        <div className="mr-auto hidden md:block">{footerExtra}</div>
      ) : null}
      <div className={cn("flex w-full items-center gap-2", !isModal && "md:ml-auto md:w-auto")}>
        {footerExtra && isModal ? <div className="shrink-0">{footerExtra}</div> : null}
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(isModal ? adminToolbarControl : adminPrimaryTouch, "shrink-0")}
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </Button>
        ) : null}
        {showBack ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(isModal ? adminToolbarControl : adminPrimaryTouch, "flex-1 md:flex-none")}
            onClick={onBack}
            disabled={busy}
          >
            {backLabel}
          </Button>
        ) : null}
        <div className="flex-1" />
        {primaryAction ? (
          <Button
            type="button"
            size="sm"
            className={cn(isModal ? adminToolbarControl : adminPrimaryTouch, "flex-1 md:flex-none")}
            onClick={primaryAction}
            disabled={busy || primaryDisabled}
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {primaryLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
        {(title || subtitle) && (
          <header className="shrink-0 space-y-0.5 border-b px-4 pb-3 pt-4 pr-12">
            {title ? (
              <h2 id="admin-wizard-title" className="type-h4 font-heading">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p id="admin-wizard-desc" className="type-caption text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </header>
        )}

        <AdminWizardStepper
          steps={steps}
          current={currentStep}
          compact
          className="shrink-0 px-4 py-3"
          hideFrom="never"
        />

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-y-auto px-4 pb-3",
            "[&_section]:p-3 [&_section]:shadow-sm [&_h2.type-h3]:type-h4",
          )}
        >
          <div className="motion-safe:animate-slide-up">{children}</div>
        </div>

        {footer}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {(title || subtitle) && (
        <header className="mb-stack space-y-1">
          {title ? <h1 className={TYPOGRAPHY_TAILWIND.h2}>{title}</h1> : null}
          {subtitle ? <p className="type-body-sm text-muted-foreground">{subtitle}</p> : null}
        </header>
      )}

      <AdminWizardStepper
        steps={steps}
        current={currentStep}
        className="mb-stack-lg"
        hideFrom="lg"
      />

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-stack-lg">
        <AdminWizardStepperSidebar steps={steps} current={currentStep} />
        <div className="min-w-0 motion-safe:animate-slide-up">{children}</div>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-14 z-sticky border-t bg-background/95 p-4 backdrop-blur-sm",
          "md:static md:bottom-auto md:mt-stack-lg md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none",
          "flex items-center gap-inline",
        )}
      >
        {footerExtra ? <div className="mr-auto hidden md:block">{footerExtra}</div> : null}
        <div className="flex w-full items-center gap-inline-sm md:ml-auto md:w-auto">
          {showBack ? (
            <Button
              type="button"
              variant="outline"
              className={cn(adminPrimaryTouch, "flex-1 md:flex-none")}
              onClick={onBack}
              disabled={busy}
            >
              {backLabel}
            </Button>
          ) : null}
          {primaryAction ? (
            <Button
              type="button"
              className={cn(adminPrimaryTouch, "flex-1 md:flex-none")}
              onClick={primaryAction}
              disabled={busy || primaryDisabled}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {primaryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
