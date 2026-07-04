const STORAGE_KEY = "kate-customer-session";
const VERIFIED_KEY = "kate-customer-verified-until";

export type CustomerSession = {
  customerId: string;
  name: string;
  phone: string;
};

export function loadCustomerSession(): CustomerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CustomerSession>;
    if (!parsed.customerId || !parsed.phone) return null;
    return {
      customerId: parsed.customerId,
      name: parsed.name ?? "",
      phone: parsed.phone,
    };
  } catch {
    return null;
  }
}

export function saveCustomerSession(session: CustomerSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore quota errors.
  }
}

export function clearCustomerSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VERIFIED_KEY);
  } catch {
    // Ignore.
  }
}

/** Phone verified via OTP — allows order history on this device for 30 days. */
export function markPhoneVerified(phone: string): void {
  if (typeof window === "undefined") return;
  try {
    const until = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem(VERIFIED_KEY, JSON.stringify({ phone, until }));
  } catch {
    // Ignore.
  }
}

export function isPhoneVerified(phone: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(VERIFIED_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { phone: string; until: number };
    return parsed.phone === phone && parsed.until > Date.now();
  } catch {
    return false;
  }
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}
