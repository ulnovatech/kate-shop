const STORAGE_KEY = "kate-checkout-autofill";

export type CheckoutAutofillData = {
  customer_name: string;
  phone: string;
  email: string;
  area: string;
  address: string;
};

export function loadCheckoutAutofill(): Partial<CheckoutAutofillData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<CheckoutAutofillData>;
    return {
      customer_name: parsed.customer_name ?? "",
      phone: parsed.phone ?? "",
      email: parsed.email ?? "",
      area: parsed.area ?? "",
      address: parsed.address ?? "",
    };
  } catch {
    return {};
  }
}

export function saveCheckoutAutofill(data: CheckoutAutofillData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota / private browsing errors.
  }
}
