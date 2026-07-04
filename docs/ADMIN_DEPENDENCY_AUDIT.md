# Admin dependency audit (C1)

Snapshot for splitting Kate Admin into `apps/admin` + `packages/*`. Regenerate summary:

```bash
npm run audit:admin
```

## Admin routes (20)

| Route file | URL today | Area |
|------------|-----------|------|
| `admin.login.tsx` | `/admin/login` | Auth |
| `admin.setup.tsx` | `/admin/setup` | Bootstrap |
| `admin.accept-invite.tsx` | `/admin/accept-invite` | Team |
| `admin.index.tsx` | `/admin` | Dashboard |
| `admin.insights.tsx` | `/admin/insights` | Analytics |
| `admin.orders.tsx` | `/admin/orders` | Orders |
| `admin.orders.$id.tsx` | `/admin/orders/:id` | Orders |
| `admin.delivery.tsx` | `/admin/delivery` | Delivery |
| `admin.products.index.tsx` | `/admin/products` | Catalog |
| `admin.products.new.tsx` | `/admin/products/new` | Catalog |
| `admin.products.$id.tsx` | `/admin/products/:id` | Catalog |
| `admin.categories.tsx` | `/admin/categories` | Catalog |
| `admin.payments.tsx` | `/admin/payments` | Money |
| `admin.payment-methods.tsx` | `/admin/payment-methods` | Money |
| `admin.notifications.tsx` | `/admin/notifications` | Ops |
| `admin.recycle.tsx` | `/admin/recycle` | Ops |
| `admin.audit.tsx` | `/admin/audit` | Ops |
| `admin.team.tsx` | `/admin/team` | Team |
| `admin.roles.tsx` | `/admin/roles` | Team |
| `admin.settings.tsx` | `/admin/settings` | Settings |

On subdomain (C6), URLs become `/`, `/login`, `/orders`, etc. — no `/admin` prefix.

## Admin components

**Shell**

- `src/components/admin-layout.tsx`
- `src/components/admin-route-guard.tsx`
- `src/components/admin-brand-mark.tsx`

**Feature**

- `src/components/admin-category-list.tsx` → re-exports `src/components/admin/categories/*`
- `src/components/admin/categories/` (13 files)
- `src/components/admin-insights-panel.tsx`
- `src/components/admin-order-pipeline.tsx`
- `src/components/product-form.tsx` (admin-only consumer today)

**Shared with shop (stay in `packages/ui` or storefront)**

- `src/components/ui/*`
- `src/components/loading-states.tsx`

## Server function imports from admin routes

### Admin-only (→ `packages/api/admin`)

| Module | Used by routes |
|--------|----------------|
| `audit.functions` | categories, products.index |
| `recycle.functions` | categories, products.index, recycle |
| `invites.functions` | team, accept-invite |
| `analytics.functions` | index, insights |
| `bootstrap.functions` | login, setup |
| `settings.functions` | settings |
| `roles.functions` | team, roles, login (via auth) |
| `notifications.server` | notifications |
| `payments.functions` | payments |

### Shared with storefront (→ `packages/api/public`)

| Module | Admin | Storefront |
|--------|-------|------------|
| `orders.functions` | list, detail, export | checkout, cart, order confirmation |
| `payment-methods.functions` | admin + payments pages | checkout |

### Direct Supabase client (candidates for server functions later)

- `admin.categories.tsx` — categories CRUD
- `admin.delivery.tsx` — delivery areas
- `admin.settings.tsx` — reads settings via client
- `admin.products.index.tsx` — product list mutations

## Lib dependencies (→ `packages/domain` in C4)

Frequently imported from admin routes:

- `auth.tsx`, `rbac.ts`, `permissions.ts`
- `categories.ts`, `catalog.ts`, `audit.ts`
- `orders.ts`, `inventory.ts`, `payments.ts`, `payment-methods.ts`
- `delivery.ts`, `notifications.ts`
- `errors.ts`, `admin-mobile.ts`, `admin-dashboard.ts`
- `shop.ts`, `phone.ts` (formatting only)

## Integrations (→ `packages/supabase`)

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/auth-attacher.ts`
- `src/start.ts` — `functionMiddleware: [attachSupabaseAuth]`

## Extraction order (recommended)

1. C2 — layout + providers in monolith
2. C3 — move routes + admin components to `apps/admin`
3. C4 — pull shared libs into `packages/*`
4. C5 — move shop routes to `apps/storefront`
