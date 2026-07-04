import type { OrderStatus } from "@/lib/db/contracts";

export const KAMPALA_TZ = "Africa/Kampala";

export type RevenuePeriods = {
  today: number;
  week: number;
  month: number;
  lifetime: number;
};

export type OrderStatusCounts = Record<OrderStatus, number>;

export type DeliveryZoneStats = {
  zoneId: string | null;
  zoneNumber: number | null;
  zoneName: string;
  orderCount: number;
  revenueCollected: number;
  orderValue: number;
};

export type LowStockProduct = {
  id: string;
  name: string;
  available_stock: number;
  reserved_stock: number;
  low_stock_threshold: number;
};

export function kampalaYmd(ref = new Date()): string {
  return ref.toLocaleDateString("en-CA", { timeZone: KAMPALA_TZ });
}

export function kampalaStartOfDay(ref = new Date()): Date {
  return new Date(`${kampalaYmd(ref)}T00:00:00+03:00`);
}

export function kampalaWeekdayIndex(ref = new Date()): number {
  const wd = ref.toLocaleDateString("en-US", { timeZone: KAMPALA_TZ, weekday: "short" });
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[wd] ?? 0;
}

export function kampalaStartOfWeek(ref = new Date()): Date {
  const start = kampalaStartOfDay(ref);
  const daysFromMonday = kampalaWeekdayIndex(ref);
  return new Date(start.getTime() - daysFromMonday * 86_400_000);
}

export function kampalaStartOfMonth(ref = new Date()): Date {
  const ymd = kampalaYmd(ref);
  const [y, m] = ymd.split("-");
  return new Date(`${y}-${m}-01T00:00:00+03:00`);
}

export function sumPaymentsInRange(
  payments: { amount_paid: number; recorded_at: string }[],
  from: Date | null,
): number {
  return payments.reduce((sum, p) => {
    if (from && new Date(p.recorded_at) < from) return sum;
    return sum + Number(p.amount_paid);
  }, 0);
}

export function orderTotal(order: { grand_total: number | null; total: number }): number {
  return Number(order.grand_total ?? order.total ?? 0);
}

export function isActiveOrder(status: string | null): boolean {
  return status !== "cancelled";
}
