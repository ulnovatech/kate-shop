import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { requirePermission } from "@kate/api/auth-middleware.server";
import {
  type NotificationEvent,
  defaultTemplate,
  renderNotificationTemplate,
  templateVarsFromOrder,
} from "@/lib/notifications";
import { enqueueStaffPushForOrder } from "./staff-push.server";

type SettingsTemplates = {
  notify_template_order_placed: string | null;
  notify_template_payment_confirmed: string | null;
  notify_template_order_shipped: string | null;
};

function templateForEvent(settings: SettingsTemplates, event: NotificationEvent): string {
  const raw =
    event === "order_placed"
      ? settings.notify_template_order_placed
      : event === "payment_confirmed"
        ? settings.notify_template_payment_confirmed
        : settings.notify_template_order_shipped;
  const trimmed = raw?.trim();
  return trimmed || defaultTemplate(event);
}

/** Queue a customer notification (Phase 1: manual send via admin UI). */
export async function enqueueOrderNotification(
  orderId: string,
  event: NotificationEvent,
  extra?: { payment_amount?: number },
): Promise<string | null> {
  const [{ data: order, error: orderErr }, { data: settings }] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("customer_name, phone, email, order_reference, grand_total, total, delivery_area")
      .eq("id", orderId)
      .maybeSingle(),
    supabaseAdmin
      .from("settings")
      .select(
        "notify_template_order_placed, notify_template_payment_confirmed, notify_template_order_shipped",
      )
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (orderErr || !order) return null;
  if (!order.phone?.trim()) return null;

  const template = templateForEvent(settings ?? {}, event);
  const body = renderNotificationTemplate(
    template,
    templateVarsFromOrder({ ...order, payment_amount: extra?.payment_amount }),
  );

  const { data: row, error } = await supabaseAdmin
    .from("notification_outbox")
    .insert({
      event_type: event,
      order_id: orderId,
      recipient_phone: order.phone,
      recipient_email: order.email,
      channel: "whatsapp",
      body,
      metadata: {
        order_reference: order.order_reference,
        payment_amount: extra?.payment_amount ?? null,
      },
    })
    .select("id")
    .single();

  if (error) {
    console.error("[notifications] enqueue failed:", error.message);
    return null;
  }

  void enqueueStaffPushForOrder(orderId, event);

  return row.id;
}

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requirePermission("orders", "view")])
  .inputValidator(
    z.object({
      status: z.enum(["pending", "sent", "failed", "skipped", "all"]).default("all"),
      limit: z.number().int().min(1).max(100).default(50),
    }),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("notification_outbox")
      .select("*, orders(order_reference, customer_name)")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.status !== "all") {
      q = q.eq("status", data.status);
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const markSentSchema = z.object({
  notificationId: z.string().uuid(),
});

export const markNotificationSent = createServerFn({ method: "POST" })
  .middleware([requirePermission("orders", "edit")])
  .inputValidator(markSentSchema)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("notification_outbox")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", data.notificationId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });
