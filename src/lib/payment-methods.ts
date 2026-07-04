import type { PaymentProvider } from "@/lib/db/contracts";

export type PaymentMethodRow = {
  id: string;
  provider: PaymentProvider;
  label: string;
  description: string;
  is_enabled: boolean;
  sort_order: number;
};

export function sortPaymentMethods<T extends { sort_order: number; label: string }>(
  methods: T[],
): T[] {
  return [...methods].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
}

export function isCodProvider(provider: PaymentProvider): boolean {
  return provider === "cash_on_delivery";
}

export function movePaymentMethodInList<T extends { id: string }>(
  methods: T[],
  id: string,
  direction: "up" | "down",
): T[] {
  const sorted = [...methods];
  const index = sorted.findIndex((m) => m.id === id);
  if (index < 0) return methods;

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= sorted.length) return methods;

  [sorted[index], sorted[swapWith]] = [sorted[swapWith], sorted[index]];
  return sorted.map((m, i) => ({ ...m, sort_order: i }));
}
