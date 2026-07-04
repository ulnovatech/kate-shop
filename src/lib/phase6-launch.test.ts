import { describe, expect, it, beforeEach } from "vitest";
import {
  allowOtpRequest,
  allowOtpVerify,
  allowStaffEmailOtpRequest,
  allowStaffEmailOtpVerify,
  resetOtpRateLimits,
} from "@/lib/otp-rate-limit";
import { applySecurityHeaders } from "@/lib/security-headers";

describe("OTP rate limiting", () => {
  beforeEach(() => resetOtpRateLimits());

  it("allows requests within limit", () => {
    const phone = "256700123456";
    expect(allowOtpRequest(phone)).toBe(true);
    expect(allowOtpRequest(phone)).toBe(true);
  });

  it("blocks excessive requests", () => {
    const phone = "256700999999";
    for (let i = 0; i < 5; i++) expect(allowOtpRequest(phone)).toBe(true);
    expect(allowOtpRequest(phone)).toBe(false);
  });

  it("limits verify attempts separately", () => {
    const phone = "256700111111";
    expect(allowOtpVerify(phone)).toBe(true);
    expect(allowOtpRequest(phone)).toBe(true);
  });

  it("limits staff email OTP per email and purpose", () => {
    const email = "staff@example.com";
    for (let i = 0; i < 5; i++) {
      expect(allowStaffEmailOtpRequest(email, "signup")).toBe(true);
    }
    expect(allowStaffEmailOtpRequest(email, "signup")).toBe(false);
    expect(allowStaffEmailOtpRequest(email, "forgot_pin")).toBe(true);
    expect(allowStaffEmailOtpVerify(email, "signup")).toBe(true);
  });
});

describe("security headers", () => {
  it("sets baseline headers", () => {
    const headers = new Headers();
    applySecurityHeaders(headers);
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });
});
