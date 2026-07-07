import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { probeStaffAppForInvite } from "./staff-invite-app-detect";

vi.mock("@/lib/staff-invite-pending", () => ({
  savePendingStaffInviteToken: vi.fn(),
}));

describe("probeStaffAppForInvite", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("returns not_installed when page stays visible", async () => {
    const openUrl = vi.fn();
    const promise = probeStaffAppForInvite("invite-token-abc123456789", {
      timeoutMs: 500,
      openUrl,
    });

    await vi.advanceTimersByTimeAsync(500);
    await expect(promise).resolves.toBe("not_installed");
    expect(openUrl).toHaveBeenCalledOnce();
  });

  it("returns opened when page becomes hidden", async () => {
    const openUrl = vi.fn();
    const promise = probeStaffAppForInvite("invite-token-abc123456789", {
      timeoutMs: 2_000,
      openUrl,
    });

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    await expect(promise).resolves.toBe("opened");
    expect(openUrl).toHaveBeenCalledOnce();
  });
});
