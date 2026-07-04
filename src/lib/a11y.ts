/** X-03 / C20 — shared accessibility helpers and launch QA invariants. */

export const MAIN_CONTENT_ID = "main-content";

export const FOCUS_RING_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Landmarks and patterns every shell must expose (verified in launch-qa.test). */
export const LAUNCH_QA_INVARIANTS = {
  skipLinkText: "Skip to main content",
  mainContentId: MAIN_CONTENT_ID,
  emptyStateRole: "status",
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
