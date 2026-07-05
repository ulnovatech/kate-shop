import { describe, expect, it } from "vitest";
import {
  generateStaffEmailOtpCode,
  generateStaffEmailVerificationToken,
  hashStaffEmailOtp,
  hashStaffEmailVerificationToken,
  staffEmailOtpCodesMatch,
  staffEmailVerificationTokensMatch,
} from "@kate/api/staff-email-otp.server";
import { isStaffEmailOtpPurpose, normalizeStaffEmail } from "@kate/api/staff-email-otp.shared";

describe("staff-email-otp.server", () => {
  it("normalizes email", () => {
    expect(normalizeStaffEmail("  Owner@Example.COM ")).toBe("owner@example.com");
  });

  it("recognizes valid purposes", () => {
    expect(isStaffEmailOtpPurpose("signup")).toBe(true);
    expect(isStaffEmailOtpPurpose("forgot_pin")).toBe(true);
    expect(isStaffEmailOtpPurpose("change_password")).toBe(true);
    expect(isStaffEmailOtpPurpose("other")).toBe(false);
  });

  it("generates 6-digit OTP codes", () => {
    const code = generateStaffEmailOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("hashes and verifies OTP codes", () => {
    const code = "123456";
    const hash = hashStaffEmailOtp(code);
    expect(staffEmailOtpCodesMatch(hash, code)).toBe(true);
    expect(staffEmailOtpCodesMatch(hash, "654321")).toBe(false);
  });

  it("hashes and verifies verification tokens", () => {
    const token = generateStaffEmailVerificationToken();
    expect(token.length).toBeGreaterThan(20);
    const hash = hashStaffEmailVerificationToken(token);
    expect(staffEmailVerificationTokensMatch(hash, token)).toBe(true);
    expect(staffEmailVerificationTokensMatch(hash, "wrong-token")).toBe(false);
  });
});
