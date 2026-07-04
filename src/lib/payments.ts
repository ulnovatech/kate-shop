import type { PaymentProvider, PaymentStatus } from "@/lib/db/contracts";
import { formatKES } from "@/lib/shop";

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  mtn_momo: "MTN MoMo",
  airtel_money: "Airtel Money",
  cash_on_delivery: "Cash on delivery",
  bank_transfer: "Bank transfer",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  partially_paid: "Partially paid",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export type PaymentSettings = {
  mtn_momo_merchant_code?: string | null;
  mtn_momo_merchant_name?: string | null;
  airtel_merchant_code?: string | null;
  airtel_merchant_name?: string | null;
  bank_transfer_instructions?: string | null;
  currency?: string | null;
};

export type PaymentInstruction = {
  provider: PaymentProvider;
  title: string;
  lines: string[];
};

export function sumPayments(payments: { amount_paid: number; payment_status?: string }[]): number {
  return payments
    .filter((p) => p.payment_status !== "failed" && p.payment_status !== "refunded")
    .reduce((s, p) => s + Number(p.amount_paid), 0);
}

export function amountRemaining(grandTotal: number, totalPaid: number): number {
  return Math.max(0, grandTotal - totalPaid);
}

export type BuildPaymentInstructionsOptions = {
  orderReference: string;
  grandTotal: number;
  amountRemaining: number;
  cashOnDelivery?: boolean;
  enabledProviders?: PaymentProvider[];
  preferredProvider?: PaymentProvider | null;
};

function shouldIncludeProvider(
  provider: PaymentProvider,
  options: BuildPaymentInstructionsOptions,
): boolean {
  if (options.preferredProvider) return provider === options.preferredProvider;
  if (options.enabledProviders?.length) return options.enabledProviders.includes(provider);
  return true;
}

export function buildPaymentInstructions(
  settings: PaymentSettings,
  order: BuildPaymentInstructionsOptions,
): PaymentInstruction[] {
  const instructions: PaymentInstruction[] = [];
  const amount = formatKES(order.amountRemaining > 0 ? order.amountRemaining : order.grandTotal);
  const refLine = `Use reference: *${order.orderReference}* when paying`;

  const mtnCode = settings.mtn_momo_merchant_code?.trim();
  const mtnName = settings.mtn_momo_merchant_name?.trim();
  if (shouldIncludeProvider("mtn_momo", order) && (mtnCode || mtnName)) {
    instructions.push({
      provider: "mtn_momo",
      title: "MTN Mobile Money",
      lines: [
        ...(mtnName ? [`Merchant: ${mtnName}`] : []),
        ...(mtnCode ? [`MoMo code / number: *${mtnCode}*`] : []),
        `Amount: *${amount}*`,
        refLine,
      ],
    });
  }

  const airtelCode = settings.airtel_merchant_code?.trim();
  const airtelName = settings.airtel_merchant_name?.trim();
  if (shouldIncludeProvider("airtel_money", order) && (airtelCode || airtelName)) {
    instructions.push({
      provider: "airtel_money",
      title: "Airtel Money",
      lines: [
        ...(airtelName ? [`Merchant: ${airtelName}`] : []),
        ...(airtelCode ? [`Airtel Money number: *${airtelCode}*`] : []),
        `Amount: *${amount}*`,
        refLine,
      ],
    });
  }

  const bank = settings.bank_transfer_instructions?.trim();
  if (shouldIncludeProvider("bank_transfer", order) && bank) {
    instructions.push({
      provider: "bank_transfer",
      title: "Bank transfer",
      lines: [bank, `Amount: ${amount}`, `Reference: ${order.orderReference}`],
    });
  }

  const showCod =
    shouldIncludeProvider("cash_on_delivery", order) &&
    (order.cashOnDelivery || order.preferredProvider === "cash_on_delivery");
  if (showCod) {
    instructions.push({
      provider: "cash_on_delivery",
      title: "Cash on delivery",
      lines: [
        `Pay ${amount} in cash when your order is delivered.`,
        `Order reference: ${order.orderReference}`,
      ],
    });
  }

  return instructions;
}
