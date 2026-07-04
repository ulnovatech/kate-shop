import { describe, expect, it } from "vitest";
import {
  isPinLocked,
  pinLockExpiry,
  staffPinSchema,
  verifyStaffPin,
  hashStaffPin,
} from "@kate/api/staff-pin.server";

describe("staffPinSchema", () => {
  it("accepts 5-digit pins", () => {
    expect(staffPinSchema.safeParse("12345").success).toBe(true);
    expect(staffPinSchema.safeParse("46657").success).toBe(true);
  });

  it("rejects wrong length or non-numeric pins", () => {
    expect(staffPinSchema.safeParse("1234").success).toBe(false);
    expect(staffPinSchema.safeParse("123456").success).toBe(false);
    expect(staffPinSchema.safeParse("123").success).toBe(false);
    expect(staffPinSchema.safeParse("12ab5").success).toBe(false);
  });
});

describe("verifyStaffPin", () => {
  it("matches hashed pin", async () => {
    const hash = await hashStaffPin("43215");
    expect(await verifyStaffPin("43215", hash)).toBe(true);
    expect(await verifyStaffPin("99999", hash)).toBe(false);
  });
});

describe("pin lockout helpers", () => {
  it("detects active lock", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isPinLocked(future)).toBe(true);
    expect(isPinLocked(null)).toBe(false);
  });

  it("sets lock expiry at max attempts", () => {
    expect(pinLockExpiry(4)).toBeNull();
    expect(pinLockExpiry(5)).not.toBeNull();
  });
});
