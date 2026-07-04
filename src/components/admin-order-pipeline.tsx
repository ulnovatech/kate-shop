import { useState } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatOrderStatus } from "@/lib/inventory";
import { nextOrderActionLabel, primaryOrderTransition } from "@/lib/human-labels";
import { adminFullWidthMobile, adminPrimaryTouch } from "@/lib/admin-mobile";
import type { OrderStatus } from "@/lib/db/contracts";
import { OrderPipelineStepper } from "@/components/admin/orders/order-pipeline-stepper";

type AdminOrderPipelineProps = {
  currentStatus: OrderStatus;
  paymentStatus: string;
  nextStatuses: OrderStatus[];
  statusNote: string;
  onStatusNoteChange: (note: string) => void;
  onConfirmStock?: () => void;
  confirmStockPending?: boolean;
  onTransition: (status: OrderStatus) => void;
  transitionPending?: boolean;
};

export function AdminOrderPipeline({
  currentStatus,
  paymentStatus,
  nextStatuses,
  statusNote,
  onStatusNoteChange,
  onConfirmStock,
  confirmStockPending,
  onTransition,
  transitionPending,
}: AdminOrderPipelineProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = primaryOrderTransition(nextStatuses);
  const secondary = nextStatuses.filter((s) => s !== primary);

  const stepper = (
    <OrderPipelineStepper
      orderStatus={currentStatus}
      paymentStatus={paymentStatus}
      className="mb-4 pb-4 border-b"
    />
  );

  if (currentStatus === "awaiting_stock_confirmation" && onConfirmStock) {
    return (
      <section className="rounded-lg border bg-card p-5">
        {stepper}
        <h2 className="font-heading text-lg font-semibold">Next step</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm stock is available before asking the customer to pay.
        </p>
        <Button
          className={`mt-4 ${adminPrimaryTouch} ${adminFullWidthMobile}`}
          disabled={confirmStockPending}
          onClick={onConfirmStock}
        >
          {confirmStockPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Confirming
            </>
          ) : (
            "Confirm stock & wait for payment"
          )}
        </Button>
        {secondary.length > 0 && (
          <Collapsible open={moreOpen} onOpenChange={setMoreOpen} className="mt-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                More actions
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {secondary.map((s) => (
                <Button
                  key={s}
                  variant="destructive"
                  disabled={transitionPending}
                  className={`${adminPrimaryTouch} w-full`}
                  onClick={() => onTransition(s)}
                >
                  {nextOrderActionLabel(s)}
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </section>
    );
  }

  if (nextStatuses.length === 0) {
    return (
      <section className="rounded-lg border bg-card p-5">
        {stepper}
        <h2 className="font-heading text-lg font-semibold">Order complete</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No further steps for {formatOrderStatus(currentStatus)} orders.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-card p-5">
      {stepper}
      <h2 className="font-heading text-lg font-semibold">Next step</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Current: {formatOrderStatus(currentStatus)}
      </p>

      {primary && (
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="status-note">Note (optional)</Label>
            <Textarea
              id="status-note"
              rows={2}
              className="mt-1.5"
              value={statusNote}
              onChange={(e) => onStatusNoteChange(e.target.value)}
              placeholder="Reason or internal comment"
            />
          </div>
          <Button
            disabled={transitionPending}
            className={`${adminPrimaryTouch} w-full`}
            onClick={() => onTransition(primary)}
          >
            {transitionPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Updating
              </>
            ) : (
              <>Next: {nextOrderActionLabel(primary)}</>
            )}
          </Button>
        </div>
      )}

      {secondary.length > 0 && (
        <Collapsible open={moreOpen} onOpenChange={setMoreOpen} className="mt-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              More actions
              <ChevronDown
                className={`h-4 w-4 transition-transform ${moreOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {secondary.map((s) => (
              <Button
                key={s}
                variant={s === "cancelled" ? "destructive" : "outline"}
                disabled={transitionPending}
                className={`${adminPrimaryTouch} w-full`}
                onClick={() => onTransition(s)}
              >
                {nextOrderActionLabel(s)}
              </Button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </section>
  );
}
