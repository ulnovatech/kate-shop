import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isAndroidChromeBrowser,
  probeStaffAppForInvite,
  resolveStaffInviteIntentFallbackUrl,
} from "./staff-invite-app-detect";

vi.mock("@/lib/staff-invite-pending", () => ({
  savePendingStaffInviteToken: vi.fn(),
}));

vi.mock("@kate/domain/admin-base-path", () => ({
  ADMIN_ACCEPT_INVITE_PATH: "/admin/accept-invite",
}));

describe("resolveStaffInviteIntentFallbackUrl", () => {
  it("builds accept-invite URL with skip_app_probe", () => {
    const url = resolveStaffInviteIntentFallbackUrl(
      "invite-token-abc123456789",
      "https://admin.example.com",
    );
    expect(url).toBe(
      "https://admin.example.com/admin/accept-invite?token=invite-token-abc123456789&skip_app_probe=1",
    );
  });
});

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
    vi.unstubAllGlobals();
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

  it("includes browser_fallback_url on Android Chrome intents", async () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    });
    vi.stubGlobal("window", {
      location: { origin: "https://admin.example.com", href: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      clearTimeout: vi.fn(),
      setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    });

    const openUrl = vi.fn();
    const promise = probeStaffAppForInvite("invite-token-abc123456789", {
      timeoutMs: 500,
      openUrl,
    });

    await vi.advanceTimersByTimeAsync(500);
    await promise;

    expect(isAndroidChromeBrowser()).toBe(true);
    const intentUrl = openUrl.mock.calls[0]?.[0] as string;
    expect(intentUrl).toContain("browser_fallback_url=");
    expect(intentUrl).toContain(
      encodeURIComponent(
        "https://admin.example.com/admin/accept-invite?token=invite-token-abc123456789&skip_app_probe=1",
      ),
    );
  });
});
