export type HapticStyle = "light" | "medium" | "success" | "error";

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  success: [12, 40, 12],
  error: [30, 40, 30],
};

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function canUseHaptics(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/** Short vibration for primary taps and feedback moments (mobile / supported devices). */
export function triggerHaptic(style: HapticStyle = "light"): void {
  if (!canUseHaptics() || prefersReducedMotion()) return;
  try {
    navigator.vibrate(PATTERNS[style]);
  } catch {
    /* ignore */
  }
}

/** Attach to primary buttons for tap feedback. */
export function hapticPointerProps(style: HapticStyle = "light") {
  return {
    onPointerDown: () => triggerHaptic(style),
  };
}
