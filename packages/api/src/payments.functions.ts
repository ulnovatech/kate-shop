import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { requirePermission } from "@kate/api/auth-middleware.server";
import { PAYMENT_PROVIDERS } from "@kate/domain/db/contracts";
import { normalizeUgandaPhone } from "@/lib/phone";
import { amountRemaining, sumPayments } from "@/lib/payments";
import { enqueueOrderNotification } from "@kate/api/notifications.server";
import { auditFromServer } from "@kate/api/audit.server";
import { assertEnabledPaymentProvider } from "@kate/api/payment-methods.functions";

const searchSchema = z.object({
  query: z.string().trim().max(100).optional(),
});

export type UnpaidOrderRow = {
  id: string;
  order_reference: string | null;
  customer_name: string;
  phone: string;
  grand_total: number | null;
  total: number;
  payment_status: string;
  order_status: string | null;
  payment_review_required: boolean;
  preferred_payment_provider: string | null;
  created_at: string;
  total_paid: number;
  amount_remaining: number;
};

export const searchUnpaidOrders = createServerFn({ method: "GET" })
  .middleware([requirePermission("payments", "view")])
  .inputValidator(searchSchema)
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("orders")
      .select(
        "id, order_reference, customer_name, phone, grand_total, total, payment_status, order_status, payment_review_required, preferred_payment_provider, created_at, payments(amount_paid, payment_status)",
      )
      .in("payment_status", ["pending", "partially_paid"])
      .neq("order_status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(50);

    const term = data.query?.trim();
    if (term) {
      const numeric = Number(term.replace(/[^\d.]/g, ""));
      const filters = [
        `order_reference.ilike.%${term}%`,
        `customer_name.ilike.%${term}%`,
        `phone.ilike.%${term}%`,
      ];
      if (!Number.isNaN(numeric) && numeric > 0) {
        filters.push(`grand_total.eq.${numeric}`, `total.eq.${numeric}`);
      }
      q = q.or(filters.join(","));
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    return (rows ?? []).map((row) => {
      const payments = (row.payments ?? []) as { amount_paid: number; payment_status: string }[];
      const totalPaid = sumPayments(payments);
      const due = row.grand_total ?? row.total;
      return {
        id: row.id,
        order_reference: row.order_reference,
        customer_name: row.customer_name,
        phone: row.phone,
        grand_total: row.grand_total,
        total: row.total,
        payment_status: row.payment_status,
        order_status: row.order_status,
        payment_review_required: row.payment_review_required,
        preferred_payment_provider: row.preferred_payment_provider,
        created_at: row.created_at,
        total_paid: totalPaid,
        amount_remaining: amountRemaining(due, totalPaid),
      } satisfies UnpaidOrderRow;
    });
  });

const recordSchema = z.object({
  orderId: z.string().uuid(),
  payment_provider: z.enum(PAYMENT_PROVIDERS),
  payer_phone: z.string().trim().min(7).max(30),
  amount_paid: z.number().positive(),
  transaction_reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requirePermission("payments", "create")])
  .inputValidator(recordSchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as { userId: string };
    const normalizedPhone = normalizeUgandaPhone(data.payer_phone);
    if (!normalizedPhone) {
      throw new Error("Enter a valid Uganda mobile number for the payer");
    }

    const { data: orderBefore, error: loadErr } = await supabaseAdmin
      .from("orders")
      .select("order_reference, payment_status, grand_total, total")
      .eq("id", data.orderId)
      .maybeSingle();

    if (loadErr) throw new Error(loadErr.message);
    if (!orderBefore) throw new Error("Order not found");

    await assertEnabledPaymentProvider(data.payment_provider);

    const { data: rpcResult, error } = await supabaseAdmin.rpc("record_order_payment", {
      p_order_id: data.orderId,
      p_payment_provider: data.payment_provider,
      p_payer_phone: normalizedPhone,
      p_amount_paid: data.amount_paid,
      p_transaction_reference: data.transaction_reference ?? "",
      p_notes: data.notes ?? "",
      p_recorded_by: auth.userId,
    });

    if (error) throw new Error(error.message ?? "Could not record payment");

    const result = rpcResult as {
      payment_id: string;
      total_paid: number;
      amount_due: number;
      payment_status: string;
      order_status: string;
      payment_review_required: boolean;
    };

    await auditFromServer(
      auth.userId,
      "payment_recorded",
      "payment",
      result.payment_id,
      {
        order_id: data.orderId,
        order_reference: orderBefore.order_reference,
        payment_status: orderBefore.payment_status,
      },
      {
        order_id: data.orderId,
        order_reference: orderBefore.order_reference,
        payment_status: result.payment_status,
        payment_provider: data.payment_provider,
        amount_paid: data.amount_paid,
        transaction_reference: data.transaction_reference ?? "",
      },
    );

    if (result.payment_status === "paid") {
      void enqueueOrderNotification(data.orderId, "payment_confirmed", {
        payment_amount: data.amount_paid,
      });
    }

    return result;
  });
