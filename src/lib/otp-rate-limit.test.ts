import { beforeEach, describe, expect, it } from "vitest";
import {
  allowStaffEmailOtpRequest,
  allowStaffEmailOtpVerify,
  resetOtpRateLimits,
} from "@/lib/otp-rate-limit";

describe("staff email OTP rate limits", () => {
  beforeEach(() => {
    resetOtpRateLimits();
  });

  it("allows up to five OTP requests per hour per email/purpose", () => {
    const email = "owner@example.com";
    const purpose = "forgot_pin";

    for (let i = 0; i < 5; i++) {
      expect(allowStaffEmailOtpRequest(email, purpose)).toBe(true);
    }
    expect(allowStaffEmailOtpRequest(email, purpose)).toBe(false);
  });

  it("tracks verify attempts separately from requests", () => {
    const email = "staff@example.com";
    const purpose = "signup";

    expect(allowStaffEmailOtpRequest(email, purpose)).toBe(true);

    for (let i = 0; i < 10; i++) {
      expect(allowStaffEmailOtpVerify(email, purpose)).toBe(true);
    }
    expect(allowStaffEmailOtpVerify(email, purpose)).toBe(false);
  });

  it("isolates buckets by purpose", () => {
    const email = "owner@example.com";

    for (let i = 0; i < 5; i++) {
      expect(allowStaffEmailOtpRequest(email, "forgot_pin")).toBe(true);
    }
    expect(allowStaffEmailOtpRequest(email, "forgot_pin")).toBe(false);
    expect(allowStaffEmailOtpRequest(email, "signup")).toBe(true);
  });
});
