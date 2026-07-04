import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatKES } from "@/lib/shop";
import { formatPhoneDisplay } from "@/lib/phone";
import {
  getAdminOrder,
  updateOrderAdminNotes,
  updateOrderStatus,
  confirmOrderStock,
} from "@/lib/api/orders.functions";
import { markOrderViewed } from "@/lib/api/order-views.functions";
import { allowedNextStatuses } from "@/lib/orders";
import { formatOrderStatus } from "@/lib/inventory";
import { PAYMENT_PROVIDER_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/payments";
import { adminFullWidthMobile, adminPrimaryTouch } from "@/lib/admin-mobile";
import type { OrderStatus } from "@/lib/db/contracts";
import { humanizeError } from "@/lib/errors";
import { humanInventoryState } from "@/lib/human-labels";
import { OrderDetailSkeleton } from "@/components/loading-states";
import { AdminOrderPipeline } from "@/components/admin-order-pipeline";

export const Route = createFileRoute("/admin/orders/$id")({
  staticData: { adminPermission: "orders" as const },
  component: AdminOrderDetail,
});

type AdminOrderData = Awaited<ReturnType<typeof getAdminOrder>>;

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [statusNote, setStatusNote] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => getAdminOrder({ data: { orderId: id } }),
  });

  useEffect(() => {
    if (order) setAdminNotes(order.admin_notes ?? "");
  }, [order?.id, order?.admin_notes]);

  useEffect(() => {
    void markOrderViewed({ data: { orderId: id } }).then(() => {
      void qc.invalidateQueries({ queryKey: ["admin-nav-badges"] });
    });
  }, [id, qc]);

  const setStatus = useMutation({
    mutationFn: (status: OrderStatus) =>
      updateOrderStatus({ data: { orderId: id, status, note: statusNote || undefined } }),
    onMutate: async (status) => {
      const key = ["admin-order", id];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<AdminOrderData>(key);
      if (previous) {
        qc.setQueryData<AdminOrderData>(key, { ...previous, order_status: status });
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success("Status updated");
      setStatusNote("");
    },
    onError: (e: unknown, _status, context) => {
      if (context?.previous) qc.setQueryData(["admin-order", id], context.previous);
      toast.error(
        humanizeError(e, { fallback: "Could not update the order.", action: "update orders" }),
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-nav-badges"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const confirmStock = useMutation({
    mutationFn: () => confirmOrderStock({ data: { orderId: id } }),
    onMutate: async () => {
      const key = ["admin-order", id];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<AdminOrderData>(key);
      if (previous) {
        qc.setQueryData<AdminOrderData>(key, {
          ...previous,
          order_status: "awaiting_payment",
          inventory_state: "reserved",
        });
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success("Stock confirmed — waiting for payment");
    },
    onError: (e: unknown, _vars, context) => {
      if (context?.previous) qc.setQueryData(["admin-order", id], context.previous);
      toast.error(
        humanizeError(e, { fallback: "Could not confirm stock.", action: "confirm stock" }),
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-nav-badges"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-audit"] });
    },
  });

  const saveNotes = useMutation({
    mutationFn: () => updateOrderAdminNotes({ data: { orderId: id, admin_notes: adminNotes } }),
    onSuccess: () => {
      toast.success("Notes saved");
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
    },
    onError: (e: unknown) =>
      toast.error(humanizeError(e, { fallback: "Could not save notes.", action: "save notes" })),
  });

  if (isLoading) {
    return (
      <OrderDetailSkeleton />
      );
  }

  if (isError || !order) {
    return (
      <>
      <p className="text-sm text-destructive">Order not found.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/admin/orders">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to orders
            </Link>
          </Button>
      </>
    );
  }

  const displayStatus = (order.order_status ?? "awaiting_payment") as OrderStatus;
  const nextStatuses = allowedNextStatuses(displayStatus);
  const total = order.grand_total ?? order.total;
  const events = [...(order.order_status_events ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  const zone = order.delivery_zones as { zone_number: number; name: string; fee: number } | null;

  return (
    <>
    <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/admin/orders">
            <ArrowLeft className="mr-2 h-4 w-4" /> All orders
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold">
              {order.order_reference ?? "Order"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.customer_name} · {formatPhoneDisplay(order.phone)} ·{" "}
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-heading text-2xl font-semibold text-primary">{formatKES(total)}</p>
            <p className="text-sm text-muted-foreground">
              {formatOrderStatus(displayStatus)} ·{" "}
              {PAYMENT_STATUS_LABELS[order.payment_status as keyof typeof PAYMENT_STATUS_LABELS]}
            </p>
          </div>
        </div>

        {order.payment_review_required && (
          <p className="mt-4 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4" /> Payment needs review. The customer paid more than
            expected.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px]">
          <aside className="order-1 space-y-6 lg:order-none lg:col-start-2 lg:row-start-1">
            <AdminOrderPipeline
              currentStatus={displayStatus}
              paymentStatus={order.payment_status}
              nextStatuses={nextStatuses}
              statusNote={statusNote}
              onStatusNoteChange={setStatusNote}
              onConfirmStock={
                displayStatus === "awaiting_stock_confirmation"
                  ? () => confirmStock.mutate()
                  : undefined
              }
              confirmStockPending={confirmStock.isPending}
              onTransition={(status) => setStatus.mutate(status)}
              transitionPending={setStatus.isPending}
            />

            <section className="rounded-lg border bg-card p-5">
              <h2 className="font-heading text-lg font-semibold">Internal notes</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Staff only — not shown to customer.
              </p>
              <Textarea
                rows={5}
                className="mt-3"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Packing instructions, follow-up, etc."
              />
              <Button
                className={`mt-3 ${adminPrimaryTouch} ${adminFullWidthMobile}`}
                disabled={saveNotes.isPending}
                onClick={() => saveNotes.mutate()}
              >
                {saveNotes.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Saving
                  </>
                ) : (
                  "Save notes"
                )}
              </Button>
            </section>
          </aside>

          <div className="order-2 space-y-6 lg:order-none lg:col-start-1 lg:row-start-1">
            <section className="rounded-lg border bg-card p-5">
              <h2 className="font-heading text-lg font-semibold">Line items</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {(order.order_items ?? []).map(
                  (it: { id: string; name: string; price: number; quantity: number }) => (
                    <li key={it.id} className="flex justify-between">
                      <span>
                        {it.name} × {it.quantity}
                      </span>
                      <span className="text-muted-foreground">
                        {formatKES(it.price * it.quantity)}
                      </span>
                    </li>
                  ),
                )}
              </ul>
              <div className="gold-divider my-4" />
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatKES(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>{formatKES(order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formatKES(total)}</span>
                </div>
                {order.total_paid > 0 && (
                  <div className="flex justify-between">
                    <span>Paid</span>
                    <span>
                      {formatKES(order.total_paid)}
                      {order.amount_remaining > 0 && ` (${formatKES(order.amount_remaining)} left)`}
                    </span>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-lg border bg-card p-5">
              <h2 className="font-heading text-lg font-semibold">Customer & delivery</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Customer</dt>
                  <dd>{order.customer_name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{formatPhoneDisplay(order.phone)}</dd>
                </div>
                {order.email && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd>{order.email}</dd>
                  </div>
                )}
                {order.delivery_area && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Area</dt>
                    <dd className="text-right">{order.delivery_area}</dd>
                  </div>
                )}
                {zone && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Zone</dt>
                    <dd>
                      Zone {zone.zone_number} — {formatKES(zone.fee)}
                    </dd>
                  </div>
                )}
                {order.address?.trim() && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Address</dt>
                    <dd className="text-right">{order.address}</dd>
                  </div>
                )}
                {order.notes?.trim() && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Customer notes</dt>
                    <dd className="max-w-xs text-right italic">{order.notes}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Inventory</dt>
                  <dd>{humanInventoryState(order.inventory_state)}</dd>
                </div>
              </dl>
            </section>

            {(order.payments ?? []).length > 0 && (
              <section className="rounded-lg border bg-card p-5">
                <h2 className="font-heading text-lg font-semibold">Payments</h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {order.payments.map(
                    (p: {
                      id: string;
                      payment_provider: string;
                      transaction_reference: string | null;
                      payer_phone_number: string;
                      amount_paid: number;
                      recorded_at: string;
                      notes: string | null;
                    }) => (
                      <li key={p.id} className="rounded-md border bg-secondary/30 p-3">
                        <p className="font-medium">
                          {PAYMENT_PROVIDER_LABELS[
                            p.payment_provider as keyof typeof PAYMENT_PROVIDER_LABELS
                          ] ?? p.payment_provider}
                          {" · "}
                          {formatKES(p.amount_paid)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPhoneDisplay(p.payer_phone_number)}
                          {p.transaction_reference && ` · ref ${p.transaction_reference}`}
                          {" · "}
                          {new Date(p.recorded_at).toLocaleString()}
                        </p>
                        {p.notes && <p className="mt-1 text-xs italic">{p.notes}</p>}
                      </li>
                    ),
                  )}
                </ul>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link to="/admin/payments">Record another payment</Link>
                </Button>
              </section>
            )}

            <section className="rounded-lg border bg-card p-5">
              <h2 className="font-heading text-lg font-semibold">Timeline</h2>
              {events.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No events yet.</p>
              ) : (
                <ol className="mt-4 space-y-4 border-l border-gold/40 pl-4">
                  {events.map(
                    (ev: {
                      id: string;
                      from_status: string | null;
                      to_status: string;
                      note: string | null;
                      created_at: string;
                    }) => (
                      <li key={ev.id} className="relative text-sm">
                        <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
                        <p className="font-medium">
                          {ev.from_status
                            ? `${formatOrderStatus(ev.from_status)} → ${formatOrderStatus(ev.to_status)}`
                            : formatOrderStatus(ev.to_status)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ev.created_at).toLocaleString()}
                        </p>
                        {ev.note && <p className="mt-1 text-muted-foreground">{ev.note}</p>}
                      </li>
                    ),
                  )}
                </ol>
              )}
            </section>
          </div>
        </div>
    </>
  );
}
