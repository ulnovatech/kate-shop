import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { isSmsDeliveryEnabled } from "@/lib/sms/otp-delivery";

describe("isSmsDeliveryEnabled", () => {
  const env = process.env;

  beforeEach(() => {
    vi.stubEnv("SMS_OTP_PROVIDER", "");
    vi.stubEnv("AFRICAS_TALKING_API_KEY", "");
    vi.stubEnv("AFRICAS_TALKING_USERNAME", "");
  });

  afterEach(() => {
    process.env = env;
    vi.unstubAllEnvs();
  });

  it("returns false when provider is noop / unset", () => {
    expect(isSmsDeliveryEnabled()).toBe(false);
  });

  it("returns true when Africa's Talking credentials are set", () => {
    vi.stubEnv("SMS_OTP_PROVIDER", "africas_talking");
    vi.stubEnv("AFRICAS_TALKING_API_KEY", "key");
    vi.stubEnv("AFRICAS_TALKING_USERNAME", "sandbox");
    expect(isSmsDeliveryEnabled()).toBe(true);
  });

  it("returns true when WesendAll credentials are set", () => {
    vi.stubEnv("SMS_OTP_PROVIDER", "wesendall");
    vi.stubEnv("WESENDALL_API_KEY", "sk");
    vi.stubEnv("WESENDALL_API_SECRET", "secret");
    vi.stubEnv("WESENDALL_WALLET_ID", "wallet");
    expect(isSmsDeliveryEnabled()).toBe(true);
  });
});
