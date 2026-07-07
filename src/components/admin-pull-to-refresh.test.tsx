import { describe, expect, it, vi } from "vitest";
import {
  pullDistanceFromDelta,
  shouldRefreshFromPullDistance,
  isPullToRefreshEnabled,
} from "./admin-pull-to-refresh";

vi.mock("@/integrations/supabase/staff-mobile-auth", () => ({
  isNativeStaffApp: vi.fn(() => false),
}));

import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";

const isNative = vi.mocked(isNativeStaffApp);

describe("pullDistanceFromDelta", () => {
  it("returns zero before activation slack", () => {
    expect(pullDistanceFromDelta(0)).toBe(0);
    expect(pullDistanceFromDelta(16)).toBe(0);
  });

  it("maps pull distance after activation", () => {
    expect(pullDistanceFromDelta(36)).toBe(10);
    expect(pullDistanceFromDelta(176)).toBe(80);
  });
});

describe("shouldRefreshFromPullDistance", () => {
  it("requires full threshold", () => {
    expect(shouldRefreshFromPullDistance(71)).toBe(false);
    expect(shouldRefreshFromPullDistance(72)).toBe(true);
  });
});

describe("isPullToRefreshEnabled", () => {
  it("is disabled in the native APK", () => {
    isNative.mockReturnValue(true);
    expect(isPullToRefreshEnabled(false)).toBe(false);
  });

  it("is enabled on mobile web when not disabled", () => {
    isNative.mockReturnValue(false);
    expect(isPullToRefreshEnabled(false)).toBe(true);
    expect(isPullToRefreshEnabled(true)).toBe(false);
  });
});
