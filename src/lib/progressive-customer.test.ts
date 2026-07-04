import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  loadCustomerSession,
  saveCustomerSession,
  clearCustomerSession,
  firstName,
  markPhoneVerified,
  isPhoneVerified,
} from "@/lib/customer-session";

describe("customer session storage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem(key: string, value: string) {
        this.store[key] = value;
      },
      removeItem(key: string) {
        delete this.store[key];
      },
    });
    clearCustomerSession();
  });

  it("persists and loads customer session", () => {
    saveCustomerSession({
      customerId: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Doe",
      phone: "256700123456",
    });
    const loaded = loadCustomerSession();
    expect(loaded?.customerId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(loaded?.name).toBe("John Doe");
    expect(loaded?.phone).toBe("256700123456");
  });

  it("clears session", () => {
    saveCustomerSession({
      customerId: "550e8400-e29b-41d4-a716-446655440000",
      name: "Jane",
      phone: "256700999999",
    });
    clearCustomerSession();
    expect(loadCustomerSession()).toBeNull();
  });

  it("extracts first name", () => {
    expect(firstName("John Doe")).toBe("John");
    expect(firstName("Mary")).toBe("Mary");
  });

  it("tracks phone verification", () => {
    markPhoneVerified("256700123456");
    expect(isPhoneVerified("256700123456")).toBe(true);
    expect(isPhoneVerified("256700999999")).toBe(false);
  });
});

describe("wishlist store shape", () => {
  it("tracks product ids locally", async () => {
    const { useWishlist } = await import("@/lib/wishlist");
    useWishlist.getState().clear();
    useWishlist.getState().toggleLocal("prod-1");
    expect(useWishlist.getState().has("prod-1")).toBe(true);
    useWishlist.getState().toggleLocal("prod-1");
    expect(useWishlist.getState().has("prod-1")).toBe(false);
  });
});
