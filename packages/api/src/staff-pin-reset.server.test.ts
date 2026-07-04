import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetStaffPinAfterEmailVerification } from "@kate/api/staff-pin-reset.server";

const consumeStaffEmailVerificationToken = vi.fn();
const loadStaffAccess = vi.fn();
const storeStaffPin = vi.fn();
const listUsers = vi.fn();

vi.mock("@kate/api/staff-email-otp.server", () => ({
  consumeStaffEmailVerificationToken: (...args: unknown[]) =>
    consumeStaffEmailVerificationToken(...args),
}));

vi.mock("@kate/api/server/permissions.server", () => ({
  loadStaffAccess: (...args: unknown[]) => loadStaffAccess(...args),
}));

vi.mock("@kate/api/staff-pin-auth.server", () => ({
  storeStaffPin: (...args: unknown[]) => storeStaffPin(...args),
}));

vi.mock("@kate/supabase/client.server", () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        listUsers: (...args: unknown[]) => listUsers(...args),
      },
    },
  },
}));

describe("resetStaffPinAfterEmailVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeStaffEmailVerificationToken.mockResolvedValue(undefined);
    loadStaffAccess.mockResolvedValue({ role: "owner" });
    storeStaffPin.mockResolvedValue(undefined);
    listUsers.mockResolvedValue({
      data: { users: [{ id: "user-1", email: "owner@example.com" }] },
      error: null,
    });
  });

  it("consumes forgot-PIN token and stores a new PIN", async () => {
    await resetStaffPinAfterEmailVerification({
      email: "Owner@Example.com",
      verificationToken: "token-abcdefghijklmnop",
      pin: "654321",
    });

    expect(consumeStaffEmailVerificationToken).toHaveBeenCalledWith({
      email: "owner@example.com",
      purpose: "forgot_pin",
      verificationToken: "token-abcdefghijklmnop",
    });
    expect(loadStaffAccess).toHaveBeenCalledWith("user-1");
    expect(storeStaffPin).toHaveBeenCalledWith("user-1", "654321");
  });

  it("rejects when no staff account exists for the email", async () => {
    listUsers.mockResolvedValueOnce({
      data: { users: [] },
      error: null,
    });

    await expect(
      resetStaffPinAfterEmailVerification({
        email: "missing@example.com",
        verificationToken: "token-abcdefghijklmnop",
        pin: "12345",
      }),
    ).rejects.toThrow(/no staff account found/i);
  });

  it("rejects when user exists but has no staff access", async () => {
    loadStaffAccess.mockResolvedValueOnce(null);

    await expect(
      resetStaffPinAfterEmailVerification({
        email: "owner@example.com",
        verificationToken: "token-abcdefghijklmnop",
        pin: "12345",
      }),
    ).rejects.toThrow(/no staff account found/i);
  });
});
