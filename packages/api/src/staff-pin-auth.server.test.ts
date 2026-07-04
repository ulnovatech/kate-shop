import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashStaffPin } from "@kate/api/staff-pin.server";
import {
  assertStaffPinValid,
  INVALID_PIN_MESSAGE,
  NO_PIN_MESSAGE,
} from "@kate/api/staff-pin-auth.server";

const mockFrom = vi.fn();
const mockUpsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();

function chain() {
  return {
    select: mockSelect.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    maybeSingle: mockMaybeSingle,
    update: mockUpdate.mockReturnValue({ eq: mockEq }),
    upsert: mockUpsert,
  };
}

vi.mock("@kate/supabase/client.server", () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

describe("assertStaffPinValid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation(() => chain());
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  });

  it("throws when no PIN credentials exist", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(assertStaffPinValid("user-1", "1234")).rejects.toThrow(NO_PIN_MESSAGE);
  });

  it("throws when account is locked", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        pin_hash: await hashStaffPin("1234"),
        failed_attempts: 5,
        locked_until: new Date(Date.now() + 60_000).toISOString(),
      },
      error: null,
    });

    await expect(assertStaffPinValid("user-1", "1234")).rejects.toThrow(
      /too many incorrect pin attempts/i,
    );
  });

  it("accepts a valid PIN and clears failures", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        pin_hash: await hashStaffPin("4321"),
        failed_attempts: 2,
        locked_until: null,
      },
      error: null,
    });

    await expect(assertStaffPinValid("user-1", "4321")).resolves.toBeUndefined();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("rejects an invalid PIN", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: {
          pin_hash: await hashStaffPin("4321"),
          failed_attempts: 0,
          locked_until: null,
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { failed_attempts: 0 }, error: null });

    await expect(assertStaffPinValid("user-1", "9999")).rejects.toThrow(INVALID_PIN_MESSAGE);
  });
});

describe("verifyScreenLockPin path", () => {
  it("uses the same PIN validation as daily login", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        pin_hash: await hashStaffPin("5678"),
        failed_attempts: 0,
        locked_until: null,
      },
      error: null,
    });

    await expect(assertStaffPinValid("staff-user", "5678")).resolves.toBeUndefined();
  });
});
