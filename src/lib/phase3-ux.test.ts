import { describe, expect, it } from "vitest";
import { buildDashboardActions, dashboardTodaySummary } from "@/lib/admin-dashboard";
import { primaryOrderTransition } from "@/lib/human-labels";
import type { AdminDashboardActions } from "@/lib/api/analytics.functions";

const sampleActions: AdminDashboardActions = {
  stockChecks: 2,
  awaitingPayment: 3,
  paymentReviews: 1,
  lowStock: 4,
  pendingMessages: 0,
};

describe("admin dashboard actions", () => {
  it("builds action cards for non-zero counts", () => {
    const items = buildDashboardActions(sampleActions, { showCatalog: true });
    expect(items.some((i) => i.id === "stock-checks" && i.count === 2)).toBe(true);
    expect(items.some((i) => i.id === "low-stock")).toBe(true);
  });

  it("hides catalog actions when user cannot manage catalog", () => {
    const items = buildDashboardActions(sampleActions, { showCatalog: false });
    expect(items.some((i) => i.id === "low-stock")).toBe(false);
  });

  it("includes unopened orders when provided", () => {
    const items = buildDashboardActions(sampleActions, {
      showCatalog: true,
      unopenedOrders: 2,
    });
    expect(items[0]?.id).toBe("unopened-orders");
    expect(items[0]?.summary).toBe("2 unopened orders");
  });

  it("summarizes a busy day", () => {
    const summary = dashboardTodaySummary(sampleActions);
    expect(summary).toContain("10 items");
    expect(summary).toContain("need your attention");
  });

  it("summarizes a busy day with unopened orders", () => {
    const summary = dashboardTodaySummary(sampleActions, { unopenedOrders: 2 });
    expect(summary).toContain("12 items");
    expect(summary).toContain("unopened orders");
  });

  it("shows calm state when nothing is pending", () => {
    expect(
      dashboardTodaySummary({
        stockChecks: 0,
        awaitingPayment: 0,
        paymentReviews: 0,
        lowStock: 0,
        pendingMessages: 0,
      }),
    ).toContain("All caught up");
  });
});

describe("order pipeline helpers", () => {
  it("picks the primary forward transition", () => {
    expect(primaryOrderTransition(["confirmed", "cancelled"])).toBe("confirmed");
    expect(primaryOrderTransition(["cancelled"])).toBe(null);
  });
});
