import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hapticPointerProps } from "@/lib/haptics";
import { formatKES } from "@/lib/shop";
import type { CheckoutWizardStepId } from "@/lib/checkout-steps";
import { cn } from "@/lib/utils";

type CheckoutWizardFooterProps = {
  step: CheckoutWizardStepId;
  total: number;
  canSubmit: boolean;
  submitting: boolean;
  formId: string;
  onBack: () => void;
  onContinue: () => void;
  className?: string;
};

export function CheckoutWizardFooter({
  step,
  total,
  canSubmit,
  submitting,
  formId,
  onBack,
  onContinue,
  className,
}: CheckoutWizardFooterProps) {
  const isLast = step === 4;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {step > 1 ? (
        <Button type="button" variant="outline" size="lg" className="shrink-0" onClick={onBack}>
          Back
        </Button>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">Total</p>
        <p className="font-heading text-lg font-semibold text-primary">{formatKES(total)}</p>
      </div>
      {isLast ? (
        <Button
          type="submit"
          form={formId}
          size="lg"
          disabled={!canSubmit}
          className="shrink-0"
          {...hapticPointerProps("medium")}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Placing order
            </>
          ) : (
            "Place order"
          )}
        </Button>
      ) : (
        <Button
          type="button"
          size="lg"
          className="shrink-0"
          onClick={onContinue}
          {...hapticPointerProps()}
        >
          Continue
        </Button>
      )}
    </div>
  );
}
