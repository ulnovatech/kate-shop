import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AdminWizardShell } from "@/components/admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatKES } from "@/lib/shop";
import { formatPhoneDisplay } from "@/lib/phone";
import type { PaymentProvider } from "@/lib/db/contracts";
import { PAYMENT_PROVIDERS } from "@/lib/db/contracts";
import { PAYMENT_PROVIDER_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/payments";
import { recordPayment, type UnpaidOrderRow } from "@/lib/api/payments.functions";
import { humanizeError } from "@/lib/errors";

const WIZARD_STEPS = [
  { id: "find", label: "Find" },
  { id: "amount", label: "Amount" },
  { id: "confirm", label: "Confirm" },
] as const;

type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

const recordSchema = z.object({
  payment_provider: z.enum(PAYMENT_PROVIDERS),
  payer_phone: z.string().trim().min(7, "Payer phone is required"),
  amount_paid: z.coerce.number().positive("Amount must be greater than zero"),
  transaction_reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});
type RecordForm = z.infer<typeof recordSchema>;

function defaultProviderForOrder(
  order: UnpaidOrderRow,
  enabledProviders: PaymentProvider[],
): PaymentProvider {
  if (
    order.preferred_payment_provider &&
    enabledProviders.includes(order.preferred_payment_provider as PaymentProvider)
  ) {
    return order.preferred_payment_provider as PaymentProvider;
  }
  return enabledProviders[0] ?? "mtn_momo";
}

type ConfirmPaymentWizardProps = {
  order: UnpaidOrderRow;
  enabledProviders: PaymentProvider[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
};

export function ConfirmPaymentWizard({
  order,
  enabledProviders,
  open,
  onOpenChange,
  onDone,
}: ConfirmPaymentWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = WIZARD_STEPS[stepIndex]?.id ?? "find";
  const defaultProvider = defaultProviderForOrder(order, enabledProviders);

  const form = useForm<RecordForm>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      payment_provider: defaultProvider,
      payer_phone: order.phone,
      amount_paid: order.amount_remaining,
      transaction_reference: "",
      notes: "",
    },
  });

  const values = form.watch();

  const mutation = useMutation({
    mutationFn: (payload: RecordForm) =>
      recordPayment({
        data: {
          orderId: order.id,
          payment_provider: payload.payment_provider,
          payer_phone: payload.payer_phone,
          amount_paid: payload.amount_paid,
          transaction_reference: payload.transaction_reference,
          notes: payload.notes,
        },
      }),
    onSuccess: (result) => {
      if (result.payment_review_required) {
        toast.warning("Payment recorded — overpayment flagged for review");
      } else if (result.payment_status === "partially_paid") {
        toast.success("Partial payment recorded");
      } else {
        toast.success("Payment recorded — order confirmed");
      }
      handleClose();
      onDone();
    },
    onError: (e: unknown) =>
      toast.error(humanizeError(e, { fallback: "Could not record this payment." })),
  });

  const handleClose = () => {
    onOpenChange(false);
    setStepIndex(0);
    form.reset({
      payment_provider: defaultProvider,
      payer_phone: order.phone,
      amount_paid: order.amount_remaining,
      transaction_reference: "",
      notes: "",
    });
  };

  const goNext = async () => {
    if (currentStep === "amount") {
      const valid = await form.trigger(["payment_provider", "payer_phone", "amount_paid"]);
      if (!valid) return;
    }
    setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1));
  };

  const submit = () => {
    void form.handleSubmit((payload) => mutation.mutate(payload))();
  };

  if (enabledProviders.length === 0) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm payment</DialogTitle>
          <DialogDescription>
            {order.order_reference ?? "Order"} · {order.customer_name}
          </DialogDescription>
        </DialogHeader>

        <AdminWizardShell
          steps={[...WIZARD_STEPS]}
          currentStep={currentStep as WizardStepId}
          isFirstStep={stepIndex === 0}
          isLastStep={stepIndex === WIZARD_STEPS.length - 1}
          onBack={() => setStepIndex((i) => Math.max(i - 1, 0))}
          onNext={goNext}
          onFinish={submit}
          nextLabel="Continue"
          finishLabel="Record payment"
          busy={mutation.isPending}
          nextDisabled={order.amount_remaining <= 0}
          finishDisabled={order.amount_remaining <= 0}
          className="pb-20 md:pb-0"
        >
          {currentStep === "find" ? (
            <FindStep order={order} />
          ) : currentStep === "amount" ? (
            <AmountStep form={form} order={order} enabledProviders={enabledProviders} />
          ) : (
            <ConfirmStep order={order} values={values} />
          )}
        </AdminWizardShell>
      </DialogContent>
    </Dialog>
  );
}

function FindStep({ order }: { order: UnpaidOrderRow }) {
  const due =
    order.amount_remaining > 0 ? order.amount_remaining : (order.grand_total ?? order.total);

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <p className="type-body-sm text-muted-foreground">
        Confirm this is the order you received payment for.
      </p>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Customer</dt>
          <dd className="font-medium">{order.customer_name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Phone</dt>
          <dd>{formatPhoneDisplay(order.phone)}</dd>
        </div>
        {order.order_reference ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Reference</dt>
            <dd className="font-mono">{order.order_reference}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Payment status</dt>
          <dd>
            {PAYMENT_STATUS_LABELS[order.payment_status as keyof typeof PAYMENT_STATUS_LABELS] ??
              order.payment_status}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t pt-2">
          <dt className="text-muted-foreground">Amount due</dt>
          <dd className="font-heading text-lg font-semibold text-primary">{formatKES(due)}</dd>
        </div>
      </dl>
    </div>
  );
}

function AmountStep({
  form,
  order,
  enabledProviders,
}: {
  form: ReturnType<typeof useForm<RecordForm>>;
  order: UnpaidOrderRow;
  enabledProviders: PaymentProvider[];
}) {
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Provider</Label>
          <Select
            value={form.watch("payment_provider")}
            onValueChange={(v) =>
              form.setValue("payment_provider", v as RecordForm["payment_provider"])
            }
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {enabledProviders.map((p) => (
                <SelectItem key={p} value={p}>
                  {PAYMENT_PROVIDER_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="wizard-amount">Amount paid (UGX)</Label>
          <Input
            id="wizard-amount"
            type="number"
            min={1}
            step={1}
            className="mt-1.5"
            {...form.register("amount_paid")}
          />
          {form.formState.errors.amount_paid ? (
            <p className="mt-1 type-caption text-destructive">
              {form.formState.errors.amount_paid.message}
            </p>
          ) : null}
          <p className="mt-1 type-caption text-muted-foreground">
            Remaining: {formatKES(order.amount_remaining)}
          </p>
        </div>
        <div>
          <Label htmlFor="wizard-phone">Payer phone</Label>
          <Input id="wizard-phone" className="mt-1.5" {...form.register("payer_phone")} />
          {form.formState.errors.payer_phone ? (
            <p className="mt-1 type-caption text-destructive">
              {form.formState.errors.payer_phone.message}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="wizard-ref">Transaction reference</Label>
          <Input
            id="wizard-ref"
            className="mt-1.5"
            placeholder="MoMo txn ID"
            {...form.register("transaction_reference")}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="wizard-notes">Notes (optional)</Label>
        <Textarea id="wizard-notes" rows={2} className="mt-1.5" {...form.register("notes")} />
      </div>
    </form>
  );
}

function ConfirmStep({ order, values }: { order: UnpaidOrderRow; values: RecordForm }) {
  return (
    <div className="space-y-4">
      <p className="type-body-sm text-muted-foreground">Review before recording this payment.</p>
      <dl className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Order</dt>
          <dd className="text-right">
            {order.order_reference ? (
              <span className="font-mono">{order.order_reference}</span>
            ) : (
              order.customer_name
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Provider</dt>
          <dd>{PAYMENT_PROVIDER_LABELS[values.payment_provider]}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="font-semibold text-primary">{formatKES(values.amount_paid)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Payer phone</dt>
          <dd>{formatPhoneDisplay(values.payer_phone)}</dd>
        </div>
        {values.transaction_reference ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Reference</dt>
            <dd className="font-mono text-xs">{values.transaction_reference}</dd>
          </div>
        ) : null}
        {values.notes ? (
          <div>
            <dt className="text-muted-foreground">Notes</dt>
            <dd className="mt-1 italic">{values.notes}</dd>
          </div>
        ) : null}
      </dl>
      {mutationPendingHint(values, order)}
    </div>
  );
}

function mutationPendingHint(values: RecordForm, order: UnpaidOrderRow) {
  if (values.amount_paid < order.amount_remaining) {
    return (
      <p className="type-caption text-amber-700">
        This is a partial payment — the order will stay open until the balance is paid.
      </p>
    );
  }
  if (values.amount_paid > order.amount_remaining) {
    return (
      <p className="type-caption text-amber-700">
        Amount exceeds the balance — this may flag the order for payment review.
      </p>
    );
  }
  return null;
}
