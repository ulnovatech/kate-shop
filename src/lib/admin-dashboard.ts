import { adminUrl } from "@/lib/admin-base-path";
import type { AdminDashboardActions } from "@/lib/api/analytics.functions";

export type DashboardActionItem = {
  id: string;
  label: string;
  description: string;
  /** Compact line for the attention queue, e.g. "2 unopened orders" */
  summary: string;
  count: number;
  to: string;
  tone: "default" | "warn" | "good";
};

function actionSummary(count: number, singular: string, plural?: string): string {
  const noun = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${noun}`;
}

export function buildDashboardActions(
  actions: AdminDashboardActions,
  options: { showCatalog: boolean; unopenedOrders?: number },
): DashboardActionItem[] {
  const items: DashboardActionItem[] = [];

  const unopened = options.unopenedOrders ?? 0;
  if (unopened > 0) {
    items.push({
      id: "unopened-orders",
      label: "Unopened orders",
      description: "New orders you have not opened yet",
      summary: actionSummary(unopened, "unopened order", "unopened orders"),
      count: unopened,
      to: adminUrl("/orders"),
      tone: "warn",
    });
  }

  if (actions.stockChecks > 0) {
    items.push({
      id: "stock-checks",
      label: "Check stock",
      description: "Orders waiting for availability confirmation",
      summary: actionSummary(actions.stockChecks, "stock check", "stock checks"),
      count: actions.stockChecks,
      to: adminUrl("/orders"),
      tone: "warn",
    });
  }

  if (actions.awaitingPayment > 0) {
    items.push({
      id: "payments",
      label: "Confirm payments",
      description: "Orders with payment still outstanding",
      summary: actionSummary(actions.awaitingPayment, "payment to confirm", "payments to confirm"),
      count: actions.awaitingPayment,
      to: adminUrl("/payments"),
      tone: "default",
    });
  }

  if (actions.paymentReviews > 0) {
    items.push({
      id: "payment-reviews",
      label: "Review overpayments",
      description: "Payments that need a second look",
      summary: actionSummary(actions.paymentReviews, "overpayment review", "overpayment reviews"),
      count: actions.paymentReviews,
      to: adminUrl("/payments"),
      tone: "warn",
    });
  }

  if (actions.pendingMessages > 0) {
    items.push({
      id: "messages",
      label: "Send messages",
      description: "Customer WhatsApp messages ready to send",
      summary: actionSummary(actions.pendingMessages, "message to send", "messages to send"),
      count: actions.pendingMessages,
      to: adminUrl("/notifications"),
      tone: "default",
    });
  }

  if (options.showCatalog && actions.lowStock > 0) {
    items.push({
      id: "low-stock",
      label: "Update stock",
      description: "Products running low on hand",
      summary: actionSummary(actions.lowStock, "low-stock item", "low-stock items"),
      count: actions.lowStock,
      to: adminUrl("/products"),
      tone: "warn",
    });
  }

  return items;
}

export function dashboardTodaySummary(
  actions: AdminDashboardActions,
  options?: { unopenedOrders?: number },
): string {
  const unopened = options?.unopenedOrders ?? 0;
  const total =
    unopened +
    actions.stockChecks +
    actions.awaitingPayment +
    actions.paymentReviews +
    actions.pendingMessages +
    actions.lowStock;

  if (total === 0) {
    return "All caught up — nothing needs your attention right now.";
  }

  const parts: string[] = [];
  if (unopened > 0) {
    parts.push(`${unopened} unopened order${unopened === 1 ? "" : "s"}`);
  }
  if (actions.stockChecks > 0) {
    parts.push(`${actions.stockChecks} stock check${actions.stockChecks === 1 ? "" : "s"}`);
  }
  if (actions.awaitingPayment > 0) {
    parts.push(`${actions.awaitingPayment} payment${actions.awaitingPayment === 1 ? "" : "s"}`);
  }
  if (actions.paymentReviews > 0) {
    parts.push(`${actions.paymentReviews} review${actions.paymentReviews === 1 ? "" : "s"}`);
  }
  if (actions.pendingMessages > 0) {
    parts.push(`${actions.pendingMessages} message${actions.pendingMessages === 1 ? "" : "s"}`);
  }
  if (actions.lowStock > 0) {
    parts.push(`${actions.lowStock} low-stock item${actions.lowStock === 1 ? "" : "s"}`);
  }

  return `${total} item${total === 1 ? "" : "s"} need your attention today — ${parts.slice(0, 3).join(", ")}.`;
}
