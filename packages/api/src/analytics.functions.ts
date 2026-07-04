import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { requirePermission } from "@kate/api/auth-middleware.server";
import { ORDER_STATUSES, type OrderStatus } from "@kate/domain/db/contracts";
import {
  type DeliveryZoneStats,
  type LowStockProduct,
  type OrderStatusCounts,
  type RevenuePeriods,
  isActiveOrder,
  kampalaStartOfDay,
  kampalaStartOfMonth,
  kampalaStartOfWeek,
  orderTotal,
  sumPaymentsInRange,
} from "@/lib/analytics";

export type AdminDashboardActions = {
  stockChecks: number;
  awaitingPayment: number;
  paymentReviews: number;
  lowStock: number;
  pendingMessages: number;
};

export type AdminDashboardStats = {
  revenue: RevenuePeriods;
  orderValue: RevenuePeriods;
  ordersPlaced: RevenuePeriods;
  ordersByStatus: OrderStatusCounts;
  actions: AdminDashboardActions;
  customers: {
    total: number;
    returning: number;
    newThisMonth: number;
  };
  inventory: {
    total: number;
    inStock: number;
    outStock: number;
    lowStock: number;
    lowStockProducts: LowStockProduct[];
  };
  categories: number;
  deliveryZones: DeliveryZoneStats[];
  recentOrders: {
    id: string;
    order_reference: string | null;
    customer_name: string;
    grand_total: number | null;
    total: number;
    order_status: string | null;
    payment_status: string;
    created_at: string;
  }[];
};

export const getAdminDashboardStats = createServerFn({ method: "GET" })
  .middleware([requirePermission("orders", "view")])
  .handler(async (): Promise<AdminDashboardStats> => {
    const now = new Date();
    const dayStart = kampalaStartOfDay(now);
    const weekStart = kampalaStartOfWeek(now);
    const monthStart = kampalaStartOfMonth(now);

    const ordersSelectWithReview =
      "id, order_status, payment_status, payment_review_required, grand_total, total, delivery_zone_id, customer_id, phone, created_at";
    const ordersSelectBase =
      "id, order_status, payment_status, grand_total, total, delivery_zone_id, customer_id, phone, created_at";

    const [
      paymentsRes,
      ordersResInitial,
      customersRes,
      productsRes,
      categoriesRes,
      zonesRes,
      recentRes,
      notificationsRes,
    ] = await Promise.all([
      supabaseAdmin.from("payments").select("amount_paid, recorded_at"),
      supabaseAdmin.from("orders").select(ordersSelectWithReview),
      supabaseAdmin.from("customers").select("id, phone, created_at"),
      supabaseAdmin
        .from("products")
        .select("id, name, available_stock, reserved_stock, low_stock_threshold")
        .eq("is_active", true)
        .is("archived_at", null)
        .is("deleted_at", null),
      supabaseAdmin
        .from("categories")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      supabaseAdmin.from("delivery_zones").select("id, zone_number, name").eq("is_active", true),
      supabaseAdmin
        .from("orders")
        .select(
          "id, order_reference, customer_name, grand_total, total, order_status, payment_status, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(8),
      supabaseAdmin
        .from("notification_outbox")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    let ordersRes = ordersResInitial;
    let paymentReviewFieldAvailable = !ordersRes.error;
    if (ordersRes.error?.message?.includes("payment_review_required")) {
      paymentReviewFieldAvailable = false;
      ordersRes = await supabaseAdmin.from("orders").select(ordersSelectBase);
    }

    if (paymentsRes.error) throw new Error(paymentsRes.error.message);
    if (ordersRes.error) throw new Error(ordersRes.error.message);
    if (customersRes.error) throw new Error(customersRes.error.message);
    if (productsRes.error) throw new Error(productsRes.error.message);
    if (categoriesRes.error) throw new Error(categoriesRes.error.message);
    if (zonesRes.error) throw new Error(zonesRes.error.message);
    if (recentRes.error) throw new Error(recentRes.error.message);
    if (notificationsRes.error) throw new Error(notificationsRes.error.message);

    const payments = paymentsRes.data ?? [];
    const orders = ordersRes.data ?? [];
    const customers = customersRes.data ?? [];
    const products = productsRes.data ?? [];
    const zones = zonesRes.data ?? [];

    const revenue: RevenuePeriods = {
      today: sumPaymentsInRange(payments, dayStart),
      week: sumPaymentsInRange(payments, weekStart),
      month: sumPaymentsInRange(payments, monthStart),
      lifetime: sumPaymentsInRange(payments, null),
    };

    const activeOrders = orders.filter((o) => isActiveOrder(o.order_status));

    const sumOrderValue = (from: Date | null) =>
      activeOrders.reduce((sum, o) => {
        if (from && new Date(o.created_at) < from) return sum;
        return sum + orderTotal(o);
      }, 0);

    const countOrders = (from: Date | null) =>
      activeOrders.filter((o) => !from || new Date(o.created_at) >= from).length;

    const orderValue: RevenuePeriods = {
      today: sumOrderValue(dayStart),
      week: sumOrderValue(weekStart),
      month: sumOrderValue(monthStart),
      lifetime: sumOrderValue(null),
    };

    const ordersPlaced: RevenuePeriods = {
      today: countOrders(dayStart),
      week: countOrders(weekStart),
      month: countOrders(monthStart),
      lifetime: countOrders(null),
    };

    const ordersByStatus = ORDER_STATUSES.reduce((acc, status) => {
      acc[status] = orders.filter((o) => (o.order_status ?? "awaiting_payment") === status).length;
      return acc;
    }, {} as OrderStatusCounts);

    const ordersPerCustomer = new Map<string, number>();
    for (const o of activeOrders) {
      const key = o.customer_id ?? o.phone;
      if (!key) continue;
      ordersPerCustomer.set(key, (ordersPerCustomer.get(key) ?? 0) + 1);
    }

    const returning = [...ordersPerCustomer.values()].filter((c) => c > 1).length;
    const newThisMonth = customers.filter((c) => new Date(c.created_at) >= monthStart).length;

    const lowStockProducts = products
      .filter((p) => p.available_stock > 0 && p.available_stock <= (p.low_stock_threshold ?? 5))
      .sort((a, b) => a.available_stock - b.available_stock)
      .slice(0, 8) as LowStockProduct[];

    const zoneById = new Map(zones.map((z) => [z.id, z]));
    const zoneAgg = new Map<string | "none", DeliveryZoneStats>();

    for (const o of activeOrders) {
      const key = o.delivery_zone_id ?? "none";
      const zone = o.delivery_zone_id ? zoneById.get(o.delivery_zone_id) : null;
      const existing = zoneAgg.get(key) ?? {
        zoneId: o.delivery_zone_id,
        zoneNumber: zone?.zone_number ?? null,
        zoneName: zone?.name ?? (o.delivery_zone_id ? "Unknown zone" : "No zone"),
        orderCount: 0,
        revenueCollected: 0,
        orderValue: 0,
      };
      existing.orderCount += 1;
      existing.orderValue += orderTotal(o);
      zoneAgg.set(key, existing);
    }

    const { data: paidPayments } = await supabaseAdmin
      .from("payments")
      .select("order_id, amount_paid");

    const zonePaymentTotals = new Map<string, number>();
    if (paidPayments) {
      const orderZone = new Map(activeOrders.map((o) => [o.id, o.delivery_zone_id]));
      for (const p of paidPayments) {
        const zoneId = orderZone.get(p.order_id);
        if (!zoneId) continue;
        zonePaymentTotals.set(zoneId, (zonePaymentTotals.get(zoneId) ?? 0) + Number(p.amount_paid));
      }
    }

    for (const [zoneId, stats] of zoneAgg) {
      if (zoneId !== "none" && typeof zoneId === "string") {
        stats.revenueCollected = zonePaymentTotals.get(zoneId) ?? 0;
      }
    }

    const deliveryZones = [...zoneAgg.values()].sort((a, b) => {
      if (a.zoneNumber != null && b.zoneNumber != null) return a.zoneNumber - b.zoneNumber;
      return b.orderCount - a.orderCount;
    });

    const inStock = products.filter((p) => p.available_stock > 0).length;
    const outStock = products.filter((p) => p.available_stock === 0).length;

    const actions: AdminDashboardActions = {
      stockChecks: ordersByStatus.awaiting_stock_confirmation ?? 0,
      awaitingPayment: orders.filter(
        (o) =>
          o.order_status !== "cancelled" &&
          o.order_status !== "delivered" &&
          (o.payment_status === "pending" || o.payment_status === "partially_paid"),
      ).length,
      paymentReviews: paymentReviewFieldAvailable
        ? orders.filter((o) => Boolean(o.payment_review_required)).length
        : 0,
      lowStock: lowStockProducts.length,
      pendingMessages: notificationsRes.count ?? 0,
    };

    return {
      revenue,
      orderValue,
      ordersPlaced,
      ordersByStatus,
      actions,
      customers: {
        total: customers.length,
        returning,
        newThisMonth,
      },
      inventory: {
        total: products.length,
        inStock,
        outStock,
        lowStock: lowStockProducts.length,
        lowStockProducts,
      },
      categories: categoriesRes.count ?? 0,
      deliveryZones,
      recentOrders: recentRes.data ?? [],
    };
  });
