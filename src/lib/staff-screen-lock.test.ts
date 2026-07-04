import { describe, expect, it } from "vitest";
import {
  clearStaffAppUnlock,
  isStaffAppUnlocked,
  markStaffAppUnlocked,
  staffScreenLockEnabled,
  staffScreenLockIdleMs,
} from "@/lib/staff-screen-lock";

describe("staff-screen-lock", () => {
  it("tracks unlock state in sessionStorage", () => {
    clearStaffAppUnlock();
    expect(isStaffAppUnlocked()).toBe(false);
    markStaffAppUnlocked();
    expect(isStaffAppUnlocked()).toBe(true);
    clearStaffAppUnlock();
    expect(isStaffAppUnlocked()).toBe(false);
  });

  it("defaults idle timeout to five minutes", () => {
    expect(staffScreenLockIdleMs()).toBe(5 * 60 * 1000);
  });

  it("keeps screen lock disabled unless explicitly enabled", () => {
    expect(staffScreenLockEnabled()).toBe(false);
  });
});
