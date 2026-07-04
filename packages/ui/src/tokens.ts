/**
 * Kate Shop V2 design tokens — programmatic access for TS/JS.
 * CSS is the source of truth; see src/styles/tokens.css and docs/design-tokens.md.
 */

export const SPACE = {
  0: "0",
  px: "1px",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  3.5: "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  11: "2.75rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const SEMANTIC_SPACE = {
  pageX: "var(--space-page-x)",
  pageY: "var(--space-page-y)",
  section: "var(--space-section)",
  stack: "var(--space-stack)",
  stackSm: "var(--space-stack-sm)",
  stackLg: "var(--space-stack-lg)",
  inline: "var(--space-inline)",
  inlineSm: "var(--space-inline-sm)",
  card: "var(--space-card)",
  cardLg: "var(--space-card-lg)",
  toolbar: "var(--space-toolbar)",
  touch: "var(--space-11)",
} as const;

export const TYPOGRAPHY = {
  display: "type-display",
  h1: "type-h1",
  h2: "type-h2",
  h3: "type-h3",
  h4: "type-h4",
  body: "type-body",
  bodySm: "type-body-sm",
  caption: "type-caption",
  overline: "type-overline",
} as const;

export const TYPOGRAPHY_TAILWIND = {
  display: "text-display font-heading",
  h1: "text-h1 font-heading",
  h2: "text-h2 font-heading",
  h3: "text-h3 font-heading",
  h4: "text-h4 font-heading",
  body: "text-body",
  bodySm: "text-body-sm",
  caption: "text-caption",
  overline: "text-overline uppercase",
} as const;

export const DURATION = {
  instant: 0,
  fast: 150,
  normal: 200,
  moderate: 300,
  slow: 400,
  slower: 500,
} as const;

export const EASING = {
  linear: "linear",
  default: "cubic-bezier(0.4, 0, 0.2, 1)",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const Z_INDEX = {
  base: 0,
  raised: 10,
  dropdown: 20,
  sticky: 30,
  overlay: 40,
  modal: 50,
  toast: 60,
  max: 9999,
} as const;

export const LAYOUT = {
  maxWidth: "72rem",
  maxWidthNarrow: "42rem",
  maxWidthWide: "90rem",
  toolbarHeight: "var(--layout-toolbar-height)",
  headerHeight: "var(--layout-header-height)",
  bottomNavHeight: "var(--layout-bottom-nav-height)",
} as const;

export const SURFACE_CLASSES = {
  default: "bg-surface text-surface-foreground",
  elevated: "bg-surface-elevated text-surface-elevated-foreground",
  muted: "bg-surface-muted text-surface-muted-foreground",
  attention: "bg-surface-attention text-surface-attention-foreground",
  success: "bg-surface-success text-surface-success-foreground",
  danger: "bg-surface-danger text-surface-danger-foreground",
} as const;

export type TypographyPreset = keyof typeof TYPOGRAPHY;
export type SurfaceRole = keyof typeof SURFACE_CLASSES;

/** Minimum touch target (44px) for mobile interactive elements. */
export const TOUCH_TARGET_CLASS = "min-h-touch min-w-touch";

/** Standard page horizontal + vertical padding. */
export const PAGE_PADDING_CLASS = "page-padding";

/** Common interactive transition for buttons, rows, cards. */
export const TRANSITION_COMMON_CLASS = "transition-common";

/** Entry animation utilities (see tokens.css). */
export const MOTION_ENTER = {
  fade: "motion-safe:animate-fade-in",
  slideUp: "motion-safe:animate-slide-up",
  scale: "motion-safe:animate-scale-in",
  successPop: "motion-safe:animate-success-pop",
} as const;
