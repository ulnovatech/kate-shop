import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { requirePermission } from "@kate/api/auth-middleware.server";
import type { AuthContext } from "@kate/api/auth-middleware.server";
import { countUnopenedOrders, TERMINAL_ORDER_STATUSES } from "@kate/api/order-views.server";

const orderIdSchema = z.object({ orderId: z.string().uuid() });

export const getUnopenedOrderCount = createServerFn({ method: "GET" })
  .middleware([requirePermission("orders", "view")])
  .handler(async ({ context }) => {
    const auth = context.auth as AuthContext;

    const [ordersRes, viewsRes] = await Promise.all([
      supabaseAdmin.from("orders").select("id, order_status"),
      supabaseAdmin
        .from("staff_order_views")
        .select("order_id")
        .eq("user_id", auth.userId),
    ]);

    if (ordersRes.error) throw new Error(ordersRes.error.message);
    if (viewsRes.error) throw new Error(viewsRes.error.message);

    const terminal = new Set<string>(TERMINAL_ORDER_STATUSES);
    const activeOrderIds = (ordersRes.data ?? [])
      .filter((row) => !terminal.has(row.order_status ?? ""))
      .map((row) => row.id);
    const viewedOrderIds = (viewsRes.data ?? []).map((row) => row.order_id);

    return { count: countUnopenedOrders(activeOrderIds, viewedOrderIds) };
  });

export const markOrderViewed = createServerFn({ method: "POST" })
  .middleware([requirePermission("orders", "view")])
  .inputValidator(orderIdSchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as AuthContext;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("id", data.orderId)
      .maybeSingle();

    if (orderError) throw new Error(orderError.message);
    if (!order) throw new Error("Order not found");

    const { error } = await supabaseAdmin.from("staff_order_views").upsert(
      {
        user_id: auth.userId,
        order_id: data.orderId,
        viewed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,order_id" },
    );

    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
