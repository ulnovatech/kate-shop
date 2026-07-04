# Design Tokens (V2 — C01)

Kate Shop uses a **semantic token system** so admin and storefront share spacing, typography, motion, and surface roles without raw pixel or hex values in components.

**Source of truth:** [src/styles/tokens.css](../src/styles/tokens.css)  
**TypeScript helpers:** `@kate/ui/tokens` ([packages/ui/src/tokens.ts](../packages/ui/src/tokens.ts))

Brand colors (emerald, gold, cream) remain in [src/styles.css](../src/styles.css). V2 tokens extend that palette with layout, type scale, motion, elevation, and role-based surfaces.

---

## Usage rules

1. Prefer **Tailwind utilities** generated from tokens (`p-page-x`, `text-h2`, `bg-surface-elevated`).
2. Use **type-* classes** when you need heading font + size in one class (`type-h1`, `type-body-sm`).
3. Use **`@kate/ui/tokens`** for programmatic class strings in components (`TYPOGRAPHY_TAILWIND.h1`, `SURFACE_CLASSES.attention`).
4. Never hard-code `px`, `rem`, or `oklch()` in route or component files when a token exists.

---

## Spacing (4px grid)

| Token | Default | Tailwind |
|-------|---------|----------|
| Page horizontal | 16px → 24px (md+) | `px-page-x` |
| Page vertical | 24px → 32px (md+) | `py-page-y` |
| Section gap | 32px | `gap-section`, `mb-section` |
| Stack (vertical) | 16px | `gap-stack` |
| Inline (horizontal) | 12px | `gap-inline` |
| Card padding | 16px | `p-card` |
| Toolbar padding | 12px | `p-toolbar` |
| Touch target min | 44px | `min-h-touch`, `min-w-touch` |

Semantic page wrapper: `page-padding` utility.

---

## Typography

| Preset | Size | Utility class | Tailwind combo |
|--------|------|---------------|----------------|
| Display | 36px | `type-display` | `text-display font-heading` |
| H1 | 30px | `type-h1` | `text-h1 font-heading` |
| H2 | 24px | `type-h2` | `text-h2 font-heading` |
| H3 | 20px | `type-h3` | `text-h3 font-heading` |
| H4 | 18px | `type-h4` | `text-h4 font-heading` |
| Body | 16px | `type-body` | `text-body` |
| Body small | 14px | `type-body-sm` | `text-body-sm` |
| Caption | 12px | `type-caption` | `text-caption` |
| Overline | 11px uppercase | `type-overline` | `text-overline uppercase` |

Fonts: **Outfit** (headings), **Figtree** (body) — defined in `styles.css`.

---

## Motion

| Token | Value | Use |
|-------|-------|-----|
| `--duration-fast` | 150ms | Hovers, color changes |
| `--duration-normal` | 200ms | Default transitions |
| `--duration-moderate` | 300ms | Panels, overlays |
| `--ease-default` | standard curve | Most UI |
| `--ease-spring` | slight overshoot | Scale-in, delight |

Utilities:

- `transition-common` — colors, opacity, shadow
- `transition-transform-ui` — transforms only
- `motion-safe:animate-fade-in` / `slide-up` / `scale-in` — entry animations (respects `prefers-reduced-motion`)

---

## Elevation

| Token | Use |
|-------|-----|
| `--shadow-sm` | Subtle cards |
| `--shadow-elevated` | Raised cards, dropdowns |
| `--shadow-overlay` | Modals, sheets |
| `--shadow-focus` | Focus rings |

Tailwind: `shadow-elevated`, `shadow-overlay`, `shadow-focus-ring`.

---

## Semantic surfaces

Role-based backgrounds (not raw emerald/gold):

| Role | Tailwind | When |
|------|----------|------|
| Default | `bg-surface` | Page background |
| Elevated | `bg-surface-elevated` | Cards, panels |
| Muted | `bg-surface-muted` | Secondary areas |
| Attention | `bg-surface-attention` | Warnings, highlights |
| Success | `bg-surface-success` | Confirmations |
| Danger | `bg-surface-danger` | Errors, destructive context |
| Overlay | `bg-surface-overlay` | Scrim behind modals |

TypeScript: `SURFACE_CLASSES.attention` etc.

---

## Layout

| Token | Value |
|-------|-------|
| `max-w-content` | 72rem (1152px) |
| `max-w-narrow` | 42rem |
| `max-w-wide` | 90rem |
| `--layout-toolbar-height` | 44px |

---

## Z-index scale

`dropdown` (20) → `sticky` (30) → `overlay` (40) → `modal` (50) → `toast` (60)

Use `z-dropdown`, `z-sticky`, `z-overlay`, `z-modal`, `z-toast` in Tailwind.

---

## List filter infrastructure (V2 — C03)

URL-synced list filters, debouncing, pagination, and query builders for admin list screens.

| Module | Path | Use |
|--------|------|-----|
| `useListFilters` | `src/hooks/use-list-filters.ts` | Draft UI + debounced URL sync |
| `useDebouncedValue` | `src/hooks/use-debounced-value.ts` | Standalone debounce |
| Schemas / parse / serialize | `src/lib/list-filters.ts` | Product + order search params |
| Product query builder | `src/lib/admin-product-list-query.ts` | Supabase filter chain |
| Saved views | `src/lib/saved-list-views.ts` | localStorage presets |
| Pagination | `@kate/api/list-pagination` | Range, totals, API pagination |

**Product route search schema:** `adminProductListSearchSchema` — `?q=&category=&status=&page=`

```tsx
const search = Route.useSearch();
const navigate = useNavigate({ from: "/admin/products/" });
const filters = useListFilters({
  search,
  navigate,
  defaults: ADMIN_PRODUCT_LIST_DEFAULTS,
  parse: parseAdminProductListFilters,
  serialize: serializeAdminProductListFilters,
  debounceKeys: ["q"],
});
// Query key: buildListQueryKey("admin-products", filters.applied)
```

---

## Shared UI primitives (V2 — C02)

Reusable admin and storefront building blocks in `src/components/admin/` and `src/components/empty-state.tsx`.

| Component | Import | Use |
|-----------|--------|-----|
| `OverlaySearch` | `@/components/admin` | Magnifier → expanding search (desktop) or top sheet (mobile) |
| `AdminListToolbar` | `@/components/admin` | Horizontal filter row: search + filters + trailing actions |
| `AdminSegmentedFilter` | `@/components/admin` | Active / Archived / All style segmented control |
| `AdminPageHeader` | `@/components/admin` | Page title, description, meta, actions |
| `EmptyState` | `@/components/empty-state` | Rich empty states with CTAs |
| `StorefrontEmptyState` | `@/components/empty-state` | Emerald/cream variant |
| `AdminConfirmDialog` | `@/components/admin` | Replace `window.confirm` |
| `AdminWizardShell` | `@/components/admin` | Multi-step flows with sticky mobile footer |
| `AdminWizardStepper` | `@/components/admin` | Horizontal + sidebar step indicators |

---

## Migration (V1 → V2)

When touching a screen in later chunks (C02+), prefer:

| V1 pattern | V2 replacement |
|------------|----------------|
| `text-2xl font-semibold` on page titles | `type-h1` or `text-h1 font-heading` |
| `p-4` page padding | `px-page-x py-page-y` or `page-padding` |
| `text-sm text-muted-foreground` | `type-body-sm text-muted-foreground` |
| Ad-hoc `transition-colors` | `transition-common` |
| Raw `shadow-md` on cards | `shadow-elevated` |

Existing screens keep working; migration is incremental per chunk.
