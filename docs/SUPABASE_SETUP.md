# Supabase setup (Chunk 1)

Project: **your** Supabase account (not Lovable-managed). Repo migrations live in `supabase/migrations/`.

## Chunk 3 — production schema

After baseline migrations, apply:

```bash
# Add DATABASE_URL to .env first (Dashboard → Database → Connection string → URI)
npm run db:chunk3
npm run supabase:verify:chunk3
```

Or paste `supabase/migrations/20260604150000_chunk3_production_schema.sql` into SQL Editor.

Adds: customers, payments, delivery zones (seeded), inventory columns, audit logs, RBAC roles (`owner`/`manager`/`staff`), order references (`KS-YYYY-NNNNNN`), and `system_config` for Chunk 4 bootstrap.

## 1. Apply baseline migrations

If tables are missing, run both files **in order** in **SQL Editor** (Dashboard → SQL → New query):

1. `supabase/migrations/20260528125047_485dcad5-c97f-4400-accb-ce5f8165f8aa.sql`
2. `supabase/migrations/20260528125110_65775d4b-651f-40da-b74c-9a9ff5f41d7c.sql`

Or, with `DATABASE_URL` in `.env`:

```bash
npm run db:migrate
```

## 2. Verify

```bash
npm run supabase:verify
```

Expect: `categories` (5 rows), `settings` (1 row), public bucket `product-images`.

## 3. Auth redirect URLs

Dashboard → **Authentication** → **URL configuration**:

| Setting | Values |
|---------|--------|
| **Site URL** | `http://localhost:5173` (Vite dev — avoids XAMPP on 8080) |
| **Redirect URLs** | `http://localhost:5173/**` |
| | `http://127.0.0.1:5173/**` |
| | `http://localhost:5174/**` (standalone Kate Admin dev) |
| | `http://127.0.0.1:5174/**` |
| | `http://localhost:8080/**` (legacy if you still use port 8080) |
| | `https://YOUR_STAGING_DOMAIN/**` (when known) |
| | `https://YOUR_PRODUCTION_DOMAIN/**` (when known) |

Enable **Email** provider for staff PIN sign-in (`/admin/login`).

### Google OAuth (setup + invite only)

Dashboard → **Authentication** → **Providers** → **Google**:

1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/) (Web application).
2. Add authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. Paste Client ID + Client Secret into Supabase Google provider.
4. Ensure redirect URLs above include your admin origin (`ADMIN_ORIGIN` / `VITE_ADMIN_ORIGIN`) so `/login-callback` works.

Google is offered on **first-time setup** and **invite accept** only — not on the daily email + PIN login screen.

## 4. Storage bucket

If `product-images` is missing, run in SQL Editor:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
```

Then re-run migration `20260528125110_...` for storage policies, or:

```bash
npm run db:ensure-storage
```

(requires `SUPABASE_SERVICE_ROLE_KEY` in `.env`)

## Chunk 4 — Admin bootstrap

Apply migration:

```bash
npm run db:chunk4
```

Or run `supabase/migrations/20260605120000_chunk4_bootstrap.sql` in SQL Editor.

**First launch:** open `/admin/setup` and create the owner account (no SQL).

Optional server env (not `VITE_`):

- `BOOTSTRAP_TOKEN` — require a secret on setup (production)
- `APP_ORIGIN` — base URL for team invite links (e.g. `http://localhost:5173`)

After setup: owner invites staff at `/admin/team`. Public signup on `/admin/login` is disabled.

## Addendum A1 — White-label branding (no migration)

Code-only. Store name, contact, SEO, and logo come from `settings` — no hardcoded storefront branding.

**Admin:** `/admin/settings` → Business info + **Branding & SEO** (`shop_name`, `logo_url`, `meta_title`, `meta_description`, `about_text`).

**Runtime:** `getStoreBranding` server fn + `useStoreBranding()` hook; changes apply without redeploy.

**Test:** change shop name in settings → refresh home → header/footer/SEO title update; admin sidebar shows new name.

---

## Addendum A2 — Audit logging (optional migration)

Accountability trail for catalog, orders, payments, settings, and team actions.

```bash
npm run db:a2   # extends audit_action enum + indexes (safe to re-run)
```

**Migration:** `supabase/migrations/20260612120000_addendum_a2_audit_actions.sql` — adds `category_*`, `inventory_changed`, `invite_created`, `role_assigned` enum values.

**Instrumented paths:**
- Server: order status, payment recorded, settings save, team invites
- Client → `recordAudit`: product save/archive/delete, category CRUD

**Admin UI:** `/admin/audit` — Owner sees full log; Manager sees operational subset (no settings/team/auth).

**Test:** update a product → entry appears in audit log; record payment → `payment_recorded` with before/after status; Manager cannot see settings changes.

---

## Addendum A7 — Mobile camera capture (no migration)

Code-only. Product image upload on mobile opens the rear camera for in-store photography.

**Admin:** `/admin/products/new` or edit → on viewports under 768px, **Take photo** uses `capture="environment"`; **From gallery** keeps multi-select without capture.

**Desktop:** unchanged dashed upload zone (file picker, multiple files).

**Test:** on a phone (or narrow browser), tap Take photo → device camera opens; gallery path still allows existing images.

---

## Addendum A3 — Recycle bin (migration)

Unified soft-delete for products and categories with restore and owner-only purge.

```bash
npm run db:a3
```

**Migration:** `supabase/migrations/20260613120000_addendum_a3_recycle_bin.sql` — adds `deleted_at` / `deleted_by`, backfills legacy `is_active=false` products, updates storefront RLS and inventory reservation.

**Admin:** `/admin/recycle` — restore (catalog staff) or purge permanently (owner). Delete actions on products/categories move items here instead of hard-delete.

**Audit:** `item_restored`, `item_purged` (+ existing delete actions via `moveToRecycle`).

**Test:** delete a product → appears in recycle bin → restore → visible on storefront again; purge removes row permanently (owner).

---

## Addendum A4 — Inventory mode STRICT / BACKORDER (migration)

Configurable checkout behavior when stock is insufficient.

```bash
npm run db:a4
```

**Migration:** `supabase/migrations/20260614120000_addendum_a4_inventory_mode.sql` — `settings.inventory_mode`, `awaiting_stock_confirmation` order status, updated `create_order_with_reservation`, `confirm_order_stock` RPC.

**Admin:** `/admin/settings` → **Inventory policy** — Strict (block checkout) or Backorder (accept order, staff confirms stock).

**Workflow (backorder):** checkout allowed → order status `awaiting_stock_confirmation` → admin **Confirm stock** on order detail → `awaiting_payment` + inventory reserved.

**Test:** set Backorder, checkout with qty &gt; available → order lands in Awaiting stock confirmation; confirm stock → awaiting payment; Strict mode blocks checkout.

---

## Addendum A5 — Payment methods (migration)

DB-driven checkout payment options: enable/disable and reorder methods; customers choose at checkout.

```bash
npm run db:a5
```

**Migration:** `supabase/migrations/20260615120000_addendum_a5_payment_methods.sql` — `payment_methods` table (seeded with MTN, Airtel, bank, COD), `orders.preferred_payment_provider`, updated `create_order_with_reservation` and `get_order_confirmation`.

**Admin:** `/admin/payment-methods` — toggle methods and reorder. Merchant codes / bank text remain in `/admin/settings` → Payment instructions.

**Checkout:** radio list of enabled methods; COD still adds the COD delivery fee when selected.

**Test:** disable Airtel in admin → checkout hides it; place order with MTN → confirmation shows MTN instructions only; record payment dropdown matches enabled methods.

---

## Addendum A6 — Category hierarchy (migration)

Up to **3 levels** of categories (e.g. Jewelry → Earrings → Studs) with tree admin and nested shop navigation.

```bash
npm run db:a6
```

**Migration:** `supabase/migrations/20260616120000_addendum_a6_category_hierarchy.sql` — `categories.parent_id`, depth validation trigger (max 3 levels).

**Admin:** `/admin/categories` — tree view, optional parent when adding/editing, reorder within siblings; delete blocked while subcategories exist.

**Storefront:** home shows top-level categories only; shop drills down with breadcrumbs and subcategory chips; filtering includes products in descendant categories.

**Test:** create 3-level tree → assign product to leaf → shop filter on root shows product; cannot add a 4th level (DB error).

---

## Addendum A8 — PWA foundation (no migration)

Installable storefront with offline static assets and cached product images. Checkout and admin stay online-only.

```bash
npm run build && npm run preview   # test service worker + install locally
```

**Docs:** [docs/PWA.md](PWA.md) — offline scope, push Phase 2 hook, Lighthouse tips.

**Behaviour:**
- Dynamic manifest at `/manifest.webmanifest` (shop name from settings)
- Service worker via `vite-plugin-pwa` — caches JS/CSS, images, Supabase product photos
- Checkout shows offline banner and blocks order submit when offline
- Push: stub in `src/lib/pwa.ts` (`subscribeToPushNotifications`) for Phase 2

**Test:** production build → Lighthouse PWA audit on `/` and a product page; Add to Home Screen on mobile; offline checkout shows message; previously viewed product image loads offline.

---

## Addendum A9 — Permission matrix & custom roles (migration)

Matrix permissions (module × action), system roles, custom roles, and staff assignments.

```bash
npm run db:a9
```

**Tables:** `roles`, `role_permissions`, `staff_role_assignments`; `admin_invites.role_id` links invites to matrix roles.

**System roles:** Owner (locked), Admin, Manager, Staff, Delivery Rider, Accountant, Stock Controller — stable UUIDs in migration.

**Admin UI:**
- `/admin/roles` — view/edit custom roles and permission matrix (Owner locked; system roles read-only except legacy Admin)
- `/admin/team` — invite by role from matrix (not legacy enum)
- Recycle bin delete/purge requires `catalog.delete`

**Auth:** `fetchStaffAccess` loads matrix permissions; middleware uses `requirePermission(module, action)` and legacy flags bridge UI nav.

**Test:** apply migration → bootstrap owner → Staff cannot delete products or open Settings; Accountant sees payments only; Delivery Rider can view/approve orders; create custom “Warehouse” role with `inventory.view` + `catalog.edit` and invite with it.

---

## Addendum A11 — RLS hardening (migration)

Align Postgres RLS with the A9 permission matrix so direct client queries and server routes enforce the same rules.

```bash
npm run db:a11
```

**Changes:**
- `staff_has_permission_key()` helper; `can_manage_catalog`, `can_manage_orders`, `is_owner`, `is_staff_member` delegate to matrix permissions (legacy `user_roles` fallback retained)
- Granular catalog policies: `catalog.view/create/edit/delete` on products, categories, images, variants
- Orders/settings/storage policies replace stale `has_role('admin')` checks
- Storage `product-images`: upload requires `catalog.create` or `catalog.edit`; delete requires `catalog.delete`
- Server middleware: orders/payments/audit/analytics/notifications use `requirePermission(module, action)`

**Settings:** remain **owner-only** (`settings.manage`) per seeded matrix — Manager cannot update shop settings via client or API.

**Test:** Manager uploads product image (RLS pass); Staff `DELETE` product via Supabase client fails; Staff API recycle delete returns 403; Delivery Rider can update order status but not settings.

---

## Addendum A10 — Mobile-first admin polish (no migration)

Daily admin ops tuned for phone/tablet (375px+).

**Layout:** collapsible nav via slide-out sheet + bottom quick links (Orders, Products, Payments, Menu). Main content uses `overflow-x-hidden` and safe bottom padding.

**Touch targets:** primary actions use 44px minimum (`src/lib/admin-mobile.ts`).

**Pages polished:**
- Orders list — stacked filters, full-width actions
- Order detail — status update panel first on mobile, full-width status buttons
- Products — card list on mobile (table on desktop)
- Product form — sticky save bar above bottom nav; camera/gallery upload buttons
- Payments — full-width record flow, inline form (no desktop-only modal)
- Delivery — larger zone controls and add-area form

**Test:** at 375px width — update order status, record payment, add product photo with no horizontal scroll; primary buttons feel tappable (≥44px).

---

## Chunk 17 — CI/CD and deploy (no migration)

Code-only. GitHub Actions + Cloudflare Workers deploy contract.

```bash
npm run lint && npm test && npm run build   # same gate as CI
npm run deploy                              # after configuring Cloudflare + env
```

**CI:** `.github/workflows/ci.yml` — lint, test, build on every push/PR; production deploy on `main` (GitHub `production` environment).

**Docs:** [docs/DEPLOY.md](DEPLOY.md) — secrets, manual approval gate, optional PR previews (`CLOUDFLARE_DEPLOY_PREVIEWS=true`), Vercel alternative.

**Test:** push a branch, open PR → `check` job green. Merge to `main` → deploy job runs (or waits for environment approval).

---

## Chunk 18 — Observability (no migration)

Code-only. Health endpoint, structured request logs, request IDs, client error reporting.

```bash
curl -s http://localhost:5173/health.json
node scripts/health-check.mjs http://localhost:5173/health.json
```

**Endpoints:** `/health.json` and `/health` — JSON status with Supabase ping (`checks.supabase`: `ok` | `error` | `skipped`).

**Logs:** every request emits one JSON line from `src/server.ts` (`event: request`). Errors use `server_error` / `client_error`. Responses include `X-Request-Id`.

**Docs:** [docs/OBSERVABILITY.md](OBSERVABILITY.md) — uptime monitors, Cloudflare log tailing, optional Sentry (Phase 2).

**Test:** hit `/health.json` locally; trigger a client error in dev console and confirm `[client-error]` / server log line.

---

## Auth chunk 18 — Staff email OTP (migration)

Gmail passcodes for owner signup, forgot PIN, and invite email verification.

```bash
npm run db:chunk18-email
```

Or run `supabase/migrations/20260701120000_chunk18_staff_email_otp.sql` in SQL Editor.

**Table:** `staff_email_verifications` — hashed 6-digit codes + short-lived verification tokens (service role only).

**Server:** `requestStaffEmailOtp`, `verifyStaffEmailOtp`, `getStaffEmailOtpDeliveryStatus` in `@kate/api/staff-email-otp.functions`.

**Env:** `EMAIL_OTP_PROVIDER=gmail`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`. See [docs/ENVIRONMENT.md](ENVIRONMENT.md).

**Test:** configure Gmail SMTP, call `requestStaffEmailOtp` with `purpose: signup`, check inbox, then `verifyStaffEmailOtp` → receive `verificationToken`.

---

## Chunk 16 — Testing (no migration)

Code-only. Vitest unit tests + Playwright E2E against your real Supabase project.

```bash
npm test              # unit + RTL (no DB)
npm run test:e2e      # optional; needs E2E_ADMIN_* in .env — see docs/TESTING.md
```

**Unit coverage:** phone normalize, delivery fees, order reference format (`KS-YYYY-NNNNNN`), workflow transitions, stock helpers, payments, notification templates.

**E2E (optional):** admin login; shop checkout → order confirmation → record payment → status update. Requires at least one visible in-stock product and staff credentials.

---

## Chunk 15 — Notifications (Phase 1 hooks)

Apply migration:

```bash
npm run db:chunk15
```

**Behaviour:**
- `notification_outbox` queues customer messages on order placed, payment confirmed (full pay), and order shipped.
- Templates editable in `/admin/settings` (notification section).
- Staff send manually from `/admin/notifications` via WhatsApp link + mark sent.

See `docs/NOTIFICATIONS.md` for Phase 2 automation design (no extra migration).

**Test:** place order → pending notification appears → Send WhatsApp → Mark sent.

---

## Chunk 14 — Admin dashboard analytics (no migration)

Code-only. `/admin` dashboard loads aggregated stats via `getAdminDashboardStats` (server function, staff auth).

**Metrics (Kampala / EAT timezone):**
- Revenue collected: today, week, month, lifetime (sum of `payments.amount_paid`)
- Orders placed + order value by period (excludes cancelled)
- Order counts by status
- Customers: total, returning (2+ orders), new this month
- Delivery zone table: orders, order value, collected revenue per zone
- Inventory summary + low-stock list (owner/manager catalog access)

**Test:** record a payment in `/admin/payments` → refresh dashboard → today revenue updates. Place orders in different zones → zone table reflects counts.

---

## Chunk 13 — Storefront SEO & search (no migration)

Code-only chunk. Set public site URL in `.env` for canonical links and sitemap:

```env
APP_ORIGIN=http://localhost:5173
# production: APP_ORIGIN=https://yourdomain.com
# optional client mirror: VITE_SITE_URL=https://yourdomain.com
```

**Features:**
- Per-page meta from DB (`settings`, `categories`, `products` `meta_title` / `meta_description`)
- Canonical URLs + Open Graph on home, shop, product, contact
- JSON-LD Product + BreadcrumbList on product pages
- `/sitemap.xml` — static pages, categories, visible products
- `/robots.txt` — allows storefront, blocks `/admin/`, `/cart`, `/checkout`
- Shop search: product name, SKU, description, and category name/slug

**Test:** view source on `/product/{slug}` for canonical + JSON-LD; open `/sitemap.xml` and `/robots.txt`; search by SKU on `/shop`.

**Performance:** product images use explicit dimensions, lazy thumbs, `decoding="async"` on hero PDP image. Target Lighthouse 90+ on key pages when deployed with real CDN/hosting.

---

## Chunk 12 — Order operations admin

Requires Chunks 8–11. Apply:

```bash
npm run db:chunk12
```

Or run `supabase/migrations/20260610120000_chunk12_order_ops.sql` in SQL Editor.

**Admin:** `/admin/orders` — search, status/date filters, CSV export. Click an order for `/admin/orders/{id}` detail.

**Detail page:** line items, customer/delivery, payments, timeline (`order_status_events`), internal admin notes, status buttons (valid transitions only).

**Workflow:** `awaiting_payment` → `confirmed` → `packed` → `shipped` → `delivered` (or `cancelled` from any active step). Invalid jumps blocked server-side. Cancel releases stock; delivered fulfills stock.

**Test:** place order → open detail → step through statuses → confirm timeline events. Try skipping a step — should fail. Export CSV with date filter.

---

## Chunk 11 — Payments Phase 1 (manual reconciliation)

Requires Chunk 10. Apply:

```bash
npm run db:chunk11
```

Or run `supabase/migrations/20260609120000_chunk11_payments.sql` in SQL Editor.

**Admin:** `/admin/payments` — search unpaid orders by reference, phone, name, or amount; record MoMo/Airtel/COD/bank payments.

**Settings:** `/admin/settings` → Payment instructions (merchant codes shown on order confirmation).

**Behaviour:**
- Partial payment → `partially_paid` on order; overpayment → `paid` + `payment_review_required`.
- Full payment auto-confirms order (`awaiting_payment` → `confirmed`) and appends timeline event.
- Confirmation page shows live MoMo/Airtel/bank instructions from settings.

**Test:** configure MoMo code in settings → place order → see instructions on `/order/KS-…` → record partial then full payment in admin → order becomes confirmed.

---

## Chunk 10 — Guest checkout + customers

Requires Chunks 8–9. Apply:

```bash
npm run db:chunk10
```

Or run `supabase/migrations/20260608120000_chunk10_guest_checkout.sql` in SQL Editor.

**Behaviour:**
- Guest checkout: name, phone, optional email, delivery area, street address, notes.
- Customers upserted by normalized Uganda phone (`2567XXXXXXXX`).
- Orders linked via `customer_id`; `checkout_session_id` stored from cart for abandoned-cart hooks later.
- Confirmation page at `/order/KS-YYYY-NNNNNN` with order summary and WhatsApp CTA.
- Payment instructions placeholder (Chunk 11 fills MoMo/Airtel details).

**Test:** place an order on `/checkout` → land on confirmation page → open WhatsApp link with reference and line items. Place second order with same phone → customer record updates, not duplicates.

---

## Chunk 9 — Delivery (DB-managed)

Requires Chunk 3 zones seed. Apply:

```bash
npm run db:chunk9
```

Or run `supabase/migrations/20260607120000_chunk9_delivery.sql` (updates checkout RPC + area RLS).

**Admin:** `/admin/delivery` (owner) — edit zone fees, areas, express/COD surcharges, free-delivery thresholds.

**Checkout:** loads `delivery_zones`, `delivery_zone_areas`, `delivery_rules` from DB only (no hardcoded zones). Disabled zones hidden. Server re-validates fees on `placeOrder`.

**Test:** change Zone 2 fee in admin → refresh checkout → fee updates. Disable a zone → its areas disappear from checkout.

---

## Chunk 8 — Inventory protection

Apply migration:

```bash
npm run db:chunk8
```

Or run `supabase/migrations/20260606120000_chunk8_inventory.sql` in SQL Editor.

**Behaviour:**
- Checkout (`placeOrder` server function) atomically creates the order and **reserves** stock (`available_stock` down, `reserved_stock` up).
- **Cancel** order → releases reservation.
- **Delivered** → consumes reserved units (`stock_quantity` down).
- Overselling blocked with row locks (`FOR UPDATE`).
- Dashboard shows available / out-of-stock / low-stock from `available_stock`.

**Test:** product with 1 available → place order → available becomes 0; second checkout fails. Cancel order → stock returns.

---

## Chunk 7 — Media pipeline (no migration)

Client-side resize before upload (`src/lib/media.ts`). Each image produces three files in the `product-images` bucket:

| Variant | Max edge | Use |
|---------|----------|-----|
| `thumb` | 200px | Admin list, PDP thumbnails |
| `medium` | 800px | Shop cards (`image_url` / `medium_url`) |
| `full` | 1600px | Product detail main image |

Stored paths: `uploads/{uuid}/thumb.webp` (or `.jpg` if WebP unsupported).

Admin product form enforces `alt_text`, `is_primary` (cover = sort 0), and `sort_order`. Storefront uses `resolveProductImageUrl()` and primary image selection via `is_primary` then `sort_order`.

**Test:** upload a large photo on `/admin/products/new`; confirm three variants in Storage and correct sizes on shop + product pages.

---

## Chunk 6 — Catalog admin (no migration)

Production CRUD for categories and products. Code: `src/lib/catalog.ts`, admin product/category routes, `product-form.tsx`.

**Categories:** create, rename, hide/show, reorder, delete (blocked if products assigned).

**Products:** create/edit, hide, feature, archive/restore, duplicate, soft-delete; list filters by name, SKU, category, and archive status.

**Storefront:** home and shop load categories from DB (`is_hidden = false`); products exclude archived.

**Test:** add a category, hide it, confirm it disappears from `/`. Duplicate a product, archive another, filter the admin list.

---

## Chunk 5 — Admin RBAC

No new migration. Roles from Chunk 3 + invites from Chunk 4 drive access in the UI and server functions.

| Role | Access |
|------|--------|
| **Owner / Admin** | Full admin: catalog, orders, settings, team invites |
| **Manager** | Products, categories, orders |
| **Staff** | Orders + dashboard (order-focused); redirected away from catalog/settings |

**Test:** invite a `staff` and `manager` user from `/admin/team`, accept each invite, then confirm nav and direct URLs match the table above.

Code: `src/lib/rbac.ts`, `src/components/admin-route-guard.tsx`, `src/lib/api/auth-middleware.server.ts`.

## 5. First admin (legacy — use /admin/setup instead)

1. Sign up at `/admin/login`
2. Copy user UUID from Dashboard → Authentication → Users
3. SQL Editor:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-UUID', 'admin');
```

Chunk 4 replaces this with a bootstrap flow.

---

## Phase 6 — Launch readiness (no migration)

Code-only. Progressive customer identity, optional SMS OTP, security headers, E2E coverage.

### Progressive customers (no passwords)

- Checkout creates/updates `customers` by phone automatically
- Browser stores `kate-customer-session` after order → `/orders` shows history
- New device: track by order reference on `/orders`, or OTP when SMS is configured

```bash
npm run db:progressive   # wishlist by customer_id + OTP challenge table
```

### Optional SMS OTP (silent until configured)

Set `SMS_OTP_PROVIDER` in server env (never `VITE_*`):

| Provider | Required vars |
|----------|----------------|
| `africas_talking` | `AFRICAS_TALKING_USERNAME`, `AFRICAS_TALKING_API_KEY` |
| `wesendall` | `WESENDALL_API_KEY`, `WESENDALL_API_SECRET`, `WESENDALL_WALLET_ID` |
| `egosms` | `EGOSMS_USERNAME`, `EGOSMS_PASSWORD` (or `EGOSMS_API_KEY`) |

Without a provider, OTP UI stays hidden; same-device session + order reference tracking still work.

### Security

- Baseline headers on all responses (`X-Frame-Options`, `Referrer-Policy`, etc.)
- OTP rate limits: 5 requests / hour / phone, 10 verify attempts / hour / phone

### E2E

```bash
npm run test:e2e -- e2e/progressive-customer.spec.ts
```

**Test:** place order → `/orders` shows welcome + order; clear cookies → track by reference still works.
