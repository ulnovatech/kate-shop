import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { requirePermission } from "@kate/api/auth-middleware.server";
import { assertDeliveryQuote, loadDeliveryConfigAdmin } from "@kate/api/delivery.server";
import { ORDER_STATUSES, type OrderStatus } from "@kate/domain/db/contracts";
import { isValidOrderTransition, ordersToCsv } from "@/lib/orders";
import { normalizeUgandaPhone } from "@/lib/phone";
import { sumPayments } from "@/lib/payments";
import { enqueueOrderNotification } from "@kate/api/notifications.server";
import { auditFromServer } from "@kate/api/audit.server";
import { assertEnabledPaymentProvider } from "@kate/api/payment-methods.functions";
import { PAYMENT_PROVIDERS } from "@kate/domain/db/contracts";
import { isCodProvider } from "@/lib/payment-methods";
import { buildPaginatedResult, normalizeListPagination } from "@kate/api/list-pagination";

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
});

const placeOrderSchema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  email: z.union([z.literal(""), z.string().trim().email()]).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
  subtotal: z.number().min(0),
  delivery_fee: z.number().min(0),
  grand_total: z.number().min(0),
  delivery_area: z.string().trim().min(1),
  delivery_zone_id: z.string().uuid().optional(),
  express_delivery: z.boolean().default(false),
  payment_provider: z.enum(PAYMENT_PROVIDERS),
  checkout_session_id: z.string().max(64).optional(),
  items: z.array(cartItemSchema).min(1),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator(placeOrderSchema)
  .handler(async ({ data }) => {
    const normalizedPhone = normalizeUgandaPhone(data.phone);
    if (!normalizedPhone) {
      throw new Error("Enter a valid Uganda mobile number (e.g. 07XX XXX XXX)");
    }

    const deliveryConfig = await loadDeliveryConfigAdmin();
    await assertEnabledPaymentProvider(data.payment_provider);
    const cashOnDelivery = isCodProvider(data.payment_provider);

    const { zoneId } = assertDeliveryQuote(deliveryConfig, {
      delivery_area: data.delivery_area,
      subtotal: data.subtotal,
      delivery_fee: data.delivery_fee,
      grand_total: data.grand_total,
      express_delivery: data.express_delivery,
      cash_on_delivery: cashOnDelivery,
    });

    const items = data.items.map((i) => ({
      product_id: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));

    const { data: result, error } = await supabaseAdmin.rpc("create_order_with_reservation", {
      p_customer_name: data.customer_name,
      p_phone: normalizedPhone,
      p_address: data.address ?? "",
      p_notes: data.notes ?? "",
      p_subtotal: data.subtotal,
      p_delivery_fee: data.delivery_fee,
      p_grand_total: data.grand_total,
      p_items: items,
      p_delivery_zone_id: zoneId,
      p_delivery_area: data.delivery_area,
      p_express_delivery: data.express_delivery,
      p_cash_on_delivery: cashOnDelivery,
      p_email: data.email?.trim() || null,
      p_checkout_session_id: data.checkout_session_id?.trim() || null,
      p_preferred_payment_provider: data.payment_provider,
    });

    if (error) {
      const msg = error.message ?? "Could not place order";
      if (error.code === "P0001" || msg.toLowerCase().includes("insufficient stock")) {
        throw new Error(msg);
      }
      throw new Error(msg);
    }

    const row = result as { order_id: string; order_reference: string; customer_id: string } | null;
    if (!row?.order_id) throw new Error("Order was not created");

    void enqueueOrderNotification(row.order_id, "order_placed");

    return {
      orderId: row.order_id,
      orderReference: row.order_reference,
      customerId: row.customer_id,
    };
  });

export type OrderConfirmationItem = {
  name: string;
  quantity: number;
  price: number;
};

export type OrderConfirmation = {
  orderReference: string;
  customerName: string;
  phone: string;
  email: string | null;
  deliveryArea: string | null;
  address: string | null;
  notes: string | null;
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  expressDelivery: boolean;
  cashOnDelivery: boolean;
  preferredPaymentProvider: string | null;
  orderStatus: string;
  paymentStatus: string;
  paymentReviewRequired: boolean;
  totalPaid: number;
  amountRemaining: number;
  createdAt: string;
  items: OrderConfirmationItem[];
};

const confirmationSchema = z.object({
  reference: z.string().trim().min(4).max(32),
});

export const getOrderConfirmation = createServerFn({ method: "GET" })
  .inputValidator(confirmationSchema)
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin.rpc("get_order_confirmation", {
      p_reference: data.reference,
    });

    if (error) throw new Error(error.message ?? "Could not load order");
    if (!row) return null;

    const o = row as Record<string, unknown>;
    const items = (o.items as OrderConfirmationItem[] | null) ?? [];

    return {
      orderReference: String(o.order_reference),
      customerName: String(o.customer_name),
      phone: String(o.phone),
      email: (o.email as string | null) ?? null,
      deliveryArea: (o.delivery_area as string | null) ?? null,
      address: (o.address as string | null) ?? null,
      notes: (o.notes as string | null) ?? null,
      subtotal: Number(o.subtotal),
      deliveryFee: Number(o.delivery_fee),
      grandTotal: Number(o.grand_total),
      expressDelivery: Boolean(o.express_delivery),
      cashOnDelivery: Boolean(o.cash_on_delivery),
      preferredPaymentProvider: (o.preferred_payment_provider as string | null) ?? null,
      orderStatus: String(o.order_status),
      paymentStatus: String(o.payment_status),
      paymentReviewRequired: Boolean(o.payment_review_required),
      totalPaid: Number(o.total_paid ?? 0),
      amountRemaining: Number(o.amount_remaining ?? 0),
      createdAt: String(o.created_at),
      items,
    } satisfies OrderConfirmation;
  });

const updateStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUSES),
  note: z.string().max(500).optional(),
});

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requirePermission("orders", "approve")])
  .inputValidator(updateStatusSchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as { userId: string };
    const { data: order, error: loadErr } = await supabaseAdmin
      .from("orders")
      .select("order_status, order_reference, payment_status")
      .eq("id", data.orderId)
      .maybeSingle();

    if (loadErr) throw new Error(loadErr.message);
    if (!order) throw new Error("Order not found");

    const current = (order.order_status ?? "awaiting_payment") as OrderStatus;
    if (!isValidOrderTransition(current, data.status)) {
      throw new Error(`Cannot change status from ${current} to ${data.status}`);
    }

    const { error } = await supabaseAdmin.rpc("update_order_status_with_inventory", {
      p_order_id: data.orderId,
      p_new_status: data.status,
      p_note: data.note ?? "",
    });
    if (error) throw new Error(error.message ?? "Could not update order");

    await auditFromServer(
      auth.userId,
      "order_updated",
      "order",
      data.orderId,
      {
        order_status: current,
        payment_status: order.payment_status,
        order_reference: order.order_reference,
      },
      {
        order_status: data.status,
        payment_status: order.payment_status,
        order_reference: order.order_reference,
        note: data.note ?? "",
      },
    );

    if (data.status === "shipped") {
      void enqueueOrderNotification(data.orderId, "order_shipped");
    }

    return { ok: true };
  });

const listOrdersSchema = z.object({
  query: z.string().trim().max(100).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.number().int().min(1).optional(),
  page_size: z.number().int().min(1).max(100).optional(),
});

export const listAdminOrders = createServerFn({ method: "GET" })
  .middleware([requirePermission("orders", "view")])
  .inputValidator(listOrdersSchema)
  .handler(async ({ data }) => {
    const pagination = normalizeListPagination(data.page, data.page_size);
    const paginated = !("limit" in pagination);

    const orderColumns =
      "id, order_reference, customer_name, phone, address, notes, total, grand_total, subtotal, delivery_fee, delivery_area, order_status, payment_status, payment_review_required, inventory_state, created_at, order_items(id, name, price, quantity)";

    let q = supabaseAdmin
      .from("orders")
      .select(orderColumns, paginated ? { count: "exact" } : undefined)
      .order("created_at", { ascending: false });

    if (!paginated) {
      q = q.limit(pagination.limit);
    }

    if (data.status) q = q.eq("order_status", data.status);
    if (data.date_from) q = q.gte("created_at", data.date_from);
    if (data.date_to) q = q.lte("created_at", `${data.date_to}T23:59:59.999Z`);

    const term = data.query?.trim();
    if (term) {
      q = q.or(
        [
          `order_reference.ilike.%${term}%`,
          `customer_name.ilike.%${term}%`,
          `phone.ilike.%${term}%`,
        ].join(","),
      );
    }

    if (paginated) {
      q = q.range(pagination.from, pagination.to);
    }

    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);

    if (paginated) {
      return buildPaginatedResult(rows ?? [], count ?? 0, pagination.page, pagination.pageSize);
    }

    return rows ?? [];
  });

const orderIdSchema = z.object({ orderId: z.string().uuid() });

export const getAdminOrder = createServerFn({ method: "GET" })
  .middleware([requirePermission("orders", "view")])
  .inputValidator(orderIdSchema)
  .handler(async ({ data }) => {
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        `*,
        order_items(id, name, price, quantity, product_id),
        payments(id, payment_provider, transaction_reference, payer_phone_number, amount_paid, payment_status, recorded_at, notes),
        order_status_events(id, from_status, to_status, note, created_at, created_by),
        customers(id, name, email, phone),
        delivery_zones(zone_number, name, fee)`,
      )
      .eq("id", data.orderId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!order) return null;

    const payments = (order.payments ?? []) as { amount_paid: number; payment_status: string }[];
    const totalPaid = sumPayments(payments);
    const due = order.grand_total ?? order.total;

    return { ...order, total_paid: totalPaid, amount_remaining: Math.max(0, due - totalPaid) };
  });

const adminNotesSchema = z.object({
  orderId: z.string().uuid(),
  admin_notes: z.string().max(2000),
});

export const updateOrderAdminNotes = createServerFn({ method: "POST" })
  .middleware([requirePermission("orders", "edit")])
  .inputValidator(adminNotesSchema)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ admin_notes: data.admin_notes.trim(), updated_at: new Date().toISOString() })
      .eq("id", data.orderId);

    if (error) throw new Error(error.message ?? "Could not save notes");
    return { ok: true };
  });

export const exportAdminOrdersCsv = createServerFn({ method: "GET" })
  .middleware([requirePermission("orders", "export")])
  .inputValidator(listOrdersSchema)
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("orders")
      .select(
        "order_reference, customer_name, phone, order_status, payment_status, grand_total, total, delivery_area, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(5000);

    if (data.status) q = q.eq("order_status", data.status);
    if (data.date_from) q = q.gte("created_at", data.date_from);
    if (data.date_to) q = q.lte("created_at", `${data.date_to}T23:59:59.999Z`);

    const term = data.query?.trim();
    if (term) {
      q = q.or(
        [
          `order_reference.ilike.%${term}%`,
          `customer_name.ilike.%${term}%`,
          `phone.ilike.%${term}%`,
        ].join(","),
      );
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    return { csv: ordersToCsv(rows ?? []) };
  });

const checkStockSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
});

export type StockCheckLine = {
  productId: string;
  name: string;
  requested: number;
  available: number;
  ok: boolean;
};

export const checkCartStock = createServerFn({ method: "POST" })
  .inputValidator(checkStockSchema)
  .handler(async ({ data }) => {
    const ids = data.items.map((i) => i.productId);
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, name, available_stock, is_active, archived_at, deleted_at")
      .in("id", ids);

    if (error) throw new Error(error.message);

    const { data: settings } = await supabaseAdmin
      .from("settings")
      .select("inventory_mode")
      .eq("id", 1)
      .maybeSingle();

    const inventoryMode = (settings?.inventory_mode ?? "strict") as "strict" | "backorder";

    const byId = new Map((products ?? []).map((p) => [p.id, p]));
    const lines: StockCheckLine[] = data.items.map((item) => {
      const p = byId.get(item.productId);
      const available =
        p?.is_active && !p?.archived_at && !p?.deleted_at ? (p.available_stock ?? 0) : 0;
      return {
        productId: item.productId,
        name: p?.name ?? "Product",
        requested: item.quantity,
        available,
        ok: available >= item.quantity,
      };
    });

    const strictOk = lines.every((l) => l.ok);

    return {
      ok: inventoryMode === "backorder" ? true : strictOk,
      inventoryMode,
      lines,
      backorderRequired: inventoryMode === "backorder" && !strictOk,
    };
  });

const orderIdOnlySchema = z.object({ orderId: z.string().uuid() });

export const confirmOrderStock = createServerFn({ method: "POST" })
  .middleware([requirePermission("orders", "edit")])
  .inputValidator(orderIdOnlySchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as { userId: string };

    const { data: before, error: loadErr } = await supabaseAdmin
      .from("orders")
      .select("order_status, order_reference")
      .eq("id", data.orderId)
      .maybeSingle();

    if (loadErr) throw new Error(loadErr.message);
    if (!before) throw new Error("Order not found");

    const { error } = await supabaseAdmin.rpc("confirm_order_stock", {
      p_order_id: data.orderId,
    });
    if (error) throw new Error(error.message ?? "Could not confirm stock");

    await auditFromServer(
      auth.userId,
      "order_updated",
      "order",
      data.orderId,
      {
        order_status: before.order_status,
        order_reference: before.order_reference,
      },
      {
        order_status: "awaiting_payment",
        order_reference: before.order_reference,
        note: "Stock confirmed",
      },
    );

    return { ok: true };
  });
