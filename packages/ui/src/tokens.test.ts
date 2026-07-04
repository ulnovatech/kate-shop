import { describe, expect, it } from "vitest";
import {
  DURATION,
  EASING,
  LAYOUT,
  MOTION_ENTER,
  SEMANTIC_SPACE,
  SURFACE_CLASSES,
  TOUCH_TARGET_CLASS,
  TYPOGRAPHY,
  TYPOGRAPHY_TAILWIND,
  Z_INDEX,
} from "./tokens";

describe("design tokens", () => {
  it("exposes 4px-grid touch target at space-11", () => {
    expect(SEMANTIC_SPACE.touch).toBe("var(--space-11)");
    expect(TOUCH_TARGET_CLASS).toContain("min-h-touch");
  });

  it("maps typography presets to utility classes", () => {
    expect(TYPOGRAPHY.h1).toBe("type-h1");
    expect(TYPOGRAPHY_TAILWIND.h1).toContain("text-h1");
    expect(TYPOGRAPHY_TAILWIND.h1).toContain("font-heading");
  });

  it("exposes motion enter utilities", () => {
    expect(MOTION_ENTER.slideUp).toContain("animate-slide-up");
    expect(MOTION_ENTER.successPop).toContain("animate-success-pop");
  });

  it("orders motion durations from fast to slower", () => {
    expect(DURATION.fast).toBeLessThan(DURATION.normal);
    expect(DURATION.normal).toBeLessThan(DURATION.moderate);
    expect(DURATION.moderate).toBeLessThan(DURATION.slow);
  });

  it("defines easing curves as valid CSS strings", () => {
    expect(EASING.default).toMatch(/^cubic-bezier\(/);
    expect(EASING.spring).toMatch(/^cubic-bezier\(/);
  });

  it("stacks z-index for overlay above sticky", () => {
    expect(Z_INDEX.sticky).toBeLessThan(Z_INDEX.overlay);
    expect(Z_INDEX.overlay).toBeLessThan(Z_INDEX.modal);
    expect(Z_INDEX.modal).toBeLessThan(Z_INDEX.toast);
  });

  it("provides semantic surface class pairs", () => {
    for (const classes of Object.values(SURFACE_CLASSES)) {
      expect(classes).toMatch(/^bg-surface/);
      expect(classes).toContain("text-");
    }
  });

  it("uses rem-based layout max widths", () => {
    expect(LAYOUT.maxWidth).toBe("72rem");
    expect(LAYOUT.maxWidthNarrow).toBe("42rem");
  });
});
