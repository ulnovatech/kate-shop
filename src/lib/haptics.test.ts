import { afterEach, describe, expect, it, vi } from "vitest";
import { canUseHaptics, prefersReducedMotion, triggerHaptic } from "@/lib/haptics";

describe("haptics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("detects vibrate support", () => {
    vi.stubGlobal("navigator", { vibrate: vi.fn() });
    expect(canUseHaptics()).toBe(true);
  });

  it("skips vibration when reduced motion is preferred", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    );
    expect(prefersReducedMotion()).toBe(true);
    triggerHaptic("success");
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("fires success pattern when allowed", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    );
    triggerHaptic("success");
    expect(vibrate).toHaveBeenCalledWith([12, 40, 12]);
  });
});
