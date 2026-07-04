import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatKES } from "@/lib/shop";
import { formatPhoneDisplay } from "@/lib/phone";
import { PAYMENT_STATUS_LABELS } from "@/lib/payments";
import type { PaymentProvider } from "@/lib/db/contracts";
import type { UnpaidOrderRow } from "@/lib/api/payments.functions";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { ConfirmPaymentWizard } from "./confirm-payment-wizard";

type UnpaidOrderRowProps = {
  order: UnpaidOrderRow;
  enabledProviders: PaymentProvider[];
  onPaymentRecorded: () => void;
};

export function UnpaidOrderRow({
  order,
  enabledProviders,
  onPaymentRecorded,
}: UnpaidOrderRowProps) {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      <article className="border-b p-card last:border-b-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="type-h3">{order.customer_name}</p>
            <p className="type-body-sm text-muted-foreground">
              {order.order_reference ? (
                <span className="font-mono text-foreground">{order.order_reference} · </span>
              ) : null}
              {formatPhoneDisplay(order.phone)} · {new Date(order.created_at).toLocaleString()}
            </p>
            <p className="mt-1 type-caption text-muted-foreground">
              {PAYMENT_STATUS_LABELS[order.payment_status as keyof typeof PAYMENT_STATUS_LABELS] ??
                order.payment_status}
              {order.total_paid > 0 ? ` · Paid ${formatKES(order.total_paid)}` : ""}
            </p>
            {order.payment_review_required ? (
              <p className="mt-2 flex items-center gap-1 type-caption text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                Overpayment review required
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="type-caption text-muted-foreground">Expected</p>
            <p className="type-h2 text-primary">
              {formatKES(
                order.amount_remaining > 0
                  ? order.amount_remaining
                  : (order.grand_total ?? order.total),
              )}
            </p>
            {order.amount_remaining > 0 && order.total_paid > 0 ? (
              <p className="type-caption text-muted-foreground">
                {formatKES(order.amount_remaining)} left of{" "}
                {formatKES(order.grand_total ?? order.total)}
              </p>
            ) : null}
          </div>
        </div>

        {enabledProviders.length > 0 ? (
          <Button
            className={`mt-stack ${adminPrimaryTouch} w-full sm:w-auto`}
            onClick={() => setWizardOpen(true)}
          >
            Confirm payment
          </Button>
        ) : null}
      </article>

      <ConfirmPaymentWizard
        order={order}
        enabledProviders={enabledProviders}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onDone={onPaymentRecorded}
      />
    </>
  );
}
