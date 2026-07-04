import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PAYMENT_PROVIDER_LABELS, type PaymentInstruction } from "@/lib/payments";
import type { PaymentProvider } from "@/lib/db/contracts";
import { formatKES, whatsappUrl } from "@/lib/shop";
import { cn } from "@/lib/utils";

const WIZARD_STEPS = [
  { id: "choose", label: "Choose" },
  { id: "instructions", label: "Pay" },
  { id: "confirm", label: "Confirm" },
] as const;

type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

function formatPaymentBlockForCopy(block: PaymentInstruction): string {
  return [block.title, ...block.lines.map((line) => line.replace(/\*/g, ""))].join("\n");
}

type OrderPaymentWizardProps = {
  instructions: PaymentInstruction[];
  orderReference: string;
  amountRemaining: number;
  grandTotal: number;
  whatsapp: string;
  paymentConfirmMessage: string;
  className?: string;
};

export function OrderPaymentWizard({
  instructions,
  orderReference,
  amountRemaining,
  grandTotal,
  whatsapp,
  paymentConfirmMessage,
  className,
}: OrderPaymentWizardProps) {
  const skipChoose = instructions.length === 1;
  const [stepIndex, setStepIndex] = useState(skipChoose ? 1 : 0);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(
    instructions[0]?.provider ?? "mtn_momo",
  );

  const currentStep = WIZARD_STEPS[stepIndex]?.id ?? "choose";
  const selected = instructions.find((b) => b.provider === selectedProvider) ?? instructions[0];
  const due = amountRemaining > 0 ? amountRemaining : grandTotal;

  const goNext = () => setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1));
  const goBack = () =>
    setStepIndex((i) => Math.max(skipChoose && i <= 1 ? 1 : i - 1, skipChoose ? 1 : 0));

  return (
    <section className={cn("rounded-md border border-gold/30 bg-gold/5 p-6", className)}>
      <h2 className="font-heading text-lg font-semibold">Complete payment</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatKES(due)} due · reference {orderReference}
      </p>

      <nav aria-label="Payment steps" className="mt-6">
        <ol className="flex items-center gap-2">
          {WIZARD_STEPS.map((step, index) => {
            const done = stepIndex > index;
            const active = stepIndex === index;
            return (
              <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
                <div className="flex min-w-0 flex-col items-center gap-1">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border text-caption font-semibold",
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
                      "truncate text-center type-overline",
                      active || done ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < WIZARD_STEPS.length - 1 ? (
                  <div
                    className={cn(
                      "mb-4 h-px flex-1",
                      stepIndex > index ? "bg-primary" : "bg-border",
                    )}
                    aria-hidden
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mt-6 space-y-4">
        {currentStep === "choose" && !skipChoose ? (
          <RadioGroup
            value={selectedProvider}
            onValueChange={(v) => setSelectedProvider(v as PaymentProvider)}
            className="space-y-2"
          >
            {instructions.map((block) => (
              <label
                key={block.provider}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border bg-card/80 p-3 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
              >
                <RadioGroupItem value={block.provider} className="mt-0.5" />
                <span className="font-medium">
                  {PAYMENT_PROVIDER_LABELS[block.provider] ?? block.title}
                </span>
              </label>
            ))}
          </RadioGroup>
        ) : null}

        {currentStep === "instructions" && selected ? (
          <div className="rounded-md border bg-card/80 p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-medium text-foreground">{selected.title}</h3>
              <CopyButton
                text={formatPaymentBlockForCopy(selected)}
                label="Copy"
                successMessage="Payment details copied"
              />
            </div>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {selected.lines.map((line, i) => (
                <li key={i}>{line.replace(/\*/g, "")}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {currentStep === "confirm" ? (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              After paying, message us on WhatsApp with your MoMo/Airtel confirmation and order
              reference <span className="font-mono text-foreground">{orderReference}</span>.
            </p>
            <Button
              asChild
              size="lg"
              className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
            >
              <a
                href={whatsappUrl(paymentConfirmMessage, whatsapp)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
                I&apos;ve sent payment — confirm on WhatsApp
              </a>
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {stepIndex > (skipChoose ? 1 : 0) ? (
          <Button type="button" variant="outline" onClick={goBack}>
            Back
          </Button>
        ) : null}
        {currentStep !== "confirm" ? (
          <Button type="button" onClick={goNext}>
            Continue
          </Button>
        ) : null}
      </div>
    </section>
  );
}
