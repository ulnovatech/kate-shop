# Packages

Shared libraries for `apps/storefront` and `apps/admin`. Extracted in **C4**.

| Package | Purpose | Status |
|---------|---------|--------|
| `@kate/domain` | contracts, rbac, permissions, categories, phone, errors | ✅ C4 |
| `@kate/supabase` | client, env, auth attacher, types | ✅ C4 |
| `@kate/ui` | shadcn primitives + `cn()` utility | ✅ C4 |
| `@kate/api` | server functions (`public/` + `admin/` exports) | ✅ C4 |

## Imports

Apps and the monolith keep existing `@/` imports via **shims** in `src/`:

```ts
// src/lib/rbac.ts
export * from "@kate/domain/rbac";
```

New code may import packages directly:

```ts
import { hasPermission } from "@kate/domain/rbac";
import { supabase } from "@kate/supabase/client";
import { Button } from "@kate/ui/components/button";
import { getAdminOrder } from "@kate/api/orders.functions";
```

## API split

| Export | Modules |
|--------|---------|
| `@kate/api/admin` | analytics, audit, bootstrap, invites, notifications, payments, recycle, roles, settings |
| `@kate/api/public` | orders, payment-methods, customer, wishlist, catalog, branding, seo, delivery |

## Maintenance

After editing a shimmed file in `src/lib/`, `src/integrations/`, or `src/components/ui/`, re-run:

```bash
npm run extract:packages
```

Or edit the canonical copy under `packages/*` directly.
