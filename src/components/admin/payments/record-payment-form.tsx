import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import type { PaymentProvider } from "@/lib/db/contracts";
import { PAYMENT_PROVIDERS } from "@/lib/db/contracts";
import { PAYMENT_PROVIDER_LABELS } from "@/lib/payments";
import { recordPayment, type UnpaidOrderRow } from "@/lib/api/payments.functions";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { humanizeError } from "@/lib/errors";

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

export function RecordPaymentForm({
  order,
  enabledProviders,
  onDone,
  expanded,
}: {
  order: UnpaidOrderRow;
  enabledProviders: PaymentProvider[];
  onDone: () => void;
  expanded: boolean;
}) {
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

  const mutation = useMutation({
    mutationFn: (values: RecordForm) =>
      recordPayment({
        data: {
          orderId: order.id,
          payment_provider: values.payment_provider,
          payer_phone: values.payer_phone,
          amount_paid: values.amount_paid,
          transaction_reference: values.transaction_reference,
          notes: values.notes,
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
      onDone();
    },
    onError: (e: unknown) =>
      toast.error(humanizeError(e, { fallback: "Could not record this payment." })),
  });

  const quickConfirm = () => {
    mutation.mutate({
      payment_provider: defaultProvider,
      payer_phone: order.phone,
      amount_paid: order.amount_remaining,
      transaction_reference: "",
      notes: "",
    });
  };

  if (!expanded) {
    return (
      <Button
        className={adminPrimaryTouch}
        disabled={mutation.isPending || order.amount_remaining <= 0}
        onClick={quickConfirm}
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Recording
          </>
        ) : (
          `Got ${formatKES(order.amount_remaining)}`
        )}
      </Button>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      className="space-y-4 rounded-md border bg-muted/30 p-4"
    >
      <p className="type-body-sm font-medium">Payment details</p>
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
          <Label htmlFor={`amount-${order.id}`}>Amount paid (UGX)</Label>
          <Input
            id={`amount-${order.id}`}
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
          <Label htmlFor={`phone-${order.id}`}>Payer phone</Label>
          <Input id={`phone-${order.id}`} className="mt-1.5" {...form.register("payer_phone")} />
        </div>
        <div>
          <Label htmlFor={`ref-${order.id}`}>Transaction reference</Label>
          <Input
            id={`ref-${order.id}`}
            className="mt-1.5"
            placeholder="MoMo txn ID"
            {...form.register("transaction_reference")}
          />
        </div>
      </div>
      <div>
        <Label htmlFor={`notes-${order.id}`}>Notes (optional)</Label>
        <Textarea
          id={`notes-${order.id}`}
          rows={2}
          className="mt-1.5"
          {...form.register("notes")}
        />
      </div>
      <Button type="submit" disabled={mutation.isPending} className={adminPrimaryTouch}>
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Recording
          </>
        ) : (
          "Record payment"
        )}
      </Button>
    </form>
  );
}
