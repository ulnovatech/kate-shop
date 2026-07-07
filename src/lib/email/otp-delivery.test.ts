import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deliverStaffOtpEmail,
  isEmailDeliveryEnabled,
  isEmailOtpDeliveryConfigured,
  resetEmailOtpDeliveryForTests,
} from "@/lib/email/otp-delivery";

describe("email otp-delivery", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
    resetEmailOtpDeliveryForTests();
    vi.restoreAllMocks();
  });

  it("is disabled when provider is noop", () => {
    process.env.EMAIL_OTP_PROVIDER = "noop";
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
    expect(isEmailDeliveryEnabled()).toBe(false);
  });

  it("is enabled when gmail credentials are set", () => {
    process.env.EMAIL_OTP_PROVIDER = "gmail";
    process.env.GMAIL_USER = "bot@example.com";
    process.env.GMAIL_APP_PASSWORD = "app-password";
    expect(isEmailDeliveryEnabled()).toBe(true);
  });

  it("is disabled when gmail provider lacks credentials", () => {
    process.env.EMAIL_OTP_PROVIDER = "gmail";
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
    expect(isEmailDeliveryEnabled()).toBe(false);
  });

  it("is enabled when console provider is selected", () => {
    process.env.EMAIL_OTP_PROVIDER = "console";
    expect(isEmailOtpDeliveryConfigured()).toBe(true);
  });

  it("delivers via console provider without SMTP", async () => {
    process.env.EMAIL_OTP_PROVIDER = "console";
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    const result = await deliverStaffOtpEmail("staff@example.com", "123456", "invite_accept");

    expect(result.delivered).toBe(true);
    expect(logSpy).toHaveBeenCalledWith(
      "[Kate Admin OTP] staff@example.com (invite_accept): 123456",
    );
  });
});
