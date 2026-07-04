import { buildStaffOrderDeepLink, staffOrderPath } from "@kate/domain/staff-mobile-links";
import { supabaseAdmin } from "@kate/supabase/client.server";
import type { NotificationEvent } from "@/lib/notifications";
import { sendFcmPush } from "./staff-push.fcm";

export function isStaffPushEnabled(): boolean {
  return process.env.STAFF_PUSH_ENABLED === "true" && Boolean(process.env.FCM_SERVER_KEY?.trim());
}

async function staffUserIdsWithOrdersView(): Promise<Set<string>> {
  const { data: rolePerms, error: permErr } = await supabaseAdmin
    .from("role_permissions")
    .select("role_id")
    .eq("permission_key", "orders.view");

  if (permErr) throw new Error(permErr.message);

  const roleIds = [...new Set((rolePerms ?? []).map((row) => row.role_id))];
  if (roleIds.length === 0) return new Set();

  const { data: assignments, error: assignErr } = await supabaseAdmin
    .from("staff_role_assignments")
    .select("user_id")
    .in("role_id", roleIds);

  if (assignErr) throw new Error(assignErr.message);

  return new Set((assignments ?? []).map((row) => row.user_id));
}

async function logStaffPush(input: {
  userId: string | null;
  eventType: string;
  orderId: string;
  title: string;
  body: string;
  status: "sent" | "failed" | "skipped";
  errorMessage?: string;
}) {
  const { error } = await supabaseAdmin.from("staff_push_log").insert({
    user_id: input.userId,
    event_type: input.eventType,
    order_id: input.orderId,
    title: input.title,
    body: input.body,
    status: input.status,
    error_message: input.errorMessage ?? null,
  });

  if (error) {
    console.error("[staff-push] log failed:", error.message);
  }
}

/** Notify staff devices when a new order is placed (C12 — FCM, gated by env). */
export async function enqueueStaffPushForOrder(
  orderId: string,
  event: NotificationEvent,
): Promise<void> {
  if (!isStaffPushEnabled()) return;
  if (event !== "order_placed") return;

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select("order_reference, customer_name")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !order) {
    console.error("[staff-push] order lookup failed:", orderErr?.message ?? "not found");
    return;
  }

  const title = "New order";
  const reference = order.order_reference?.trim() || "Kate Shop";
  const customer = order.customer_name?.trim();
  const body = customer ? `${reference} — ${customer}` : reference;
  const path = staffOrderPath(orderId);
  const deepLink = buildStaffOrderDeepLink(orderId);

  let eligibleStaff: Set<string>;
  try {
    eligibleStaff = await staffUserIdsWithOrdersView();
  } catch (error) {
    console.error("[staff-push] staff lookup failed:", error);
    return;
  }

  if (eligibleStaff.size === 0) return;

  const { data: subscriptions, error: subErr } = await supabaseAdmin
    .from("staff_push_subscriptions")
    .select("id, user_id, token")
    .eq("enabled", true)
    .eq("platform", "fcm");

  if (subErr) {
    console.error("[staff-push] subscription lookup failed:", subErr.message);
    return;
  }

  const targets = (subscriptions ?? []).filter((sub) => eligibleStaff.has(sub.user_id));
  if (targets.length === 0) return;

  await Promise.all(
    targets.map(async (sub) => {
      const result = await sendFcmPush({
        token: sub.token,
        title,
        body,
        data: {
          event,
          orderId,
          path,
          deepLink,
        },
      });

      if (!result.ok && result.error.includes("NotRegistered")) {
        await supabaseAdmin
          .from("staff_push_subscriptions")
          .update({ enabled: false, updated_at: new Date().toISOString() })
          .eq("id", sub.id);
      }

      await logStaffPush({
        userId: sub.user_id,
        eventType: event,
        orderId,
        title,
        body,
        status: result.ok ? "sent" : "failed",
        errorMessage: result.ok ? undefined : result.error,
      });
    }),
  );
}
