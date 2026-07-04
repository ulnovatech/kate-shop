/** DS-06 — programmatic motion class names (CSS in tokens.css). */
export const MOTION_ENTER = {
  fade: "motion-safe:animate-fade-in",
  slideUp: "motion-safe:animate-slide-up",
  scale: "motion-safe:animate-scale-in",
  successPop: "motion-safe:animate-success-pop",
} as const;

export type MotionEnterVariant = keyof typeof MOTION_ENTER;
