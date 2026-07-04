# Testing (Chunk 16)

Kate shop uses **Vitest** for unit/component tests and **Playwright** for E2E flows against your real Supabase project (no mock catalog).

## Unit & component tests

```bash
npm test          # run once (CI default)
npm run test:watch
```

**Coverage areas:**
- `src/lib/phone.ts` — Uganda number normalization
- `src/lib/delivery.ts` — zone fees, free-delivery thresholds, express/COD
- `src/lib/orders.ts` — `KS-YYYY-NNNNNN` references, workflow transitions, CSV export
- `src/lib/inventory.ts` + `src/lib/catalog.ts` — stock helpers
- `src/lib/payments.ts` — payment sums and instruction builder
- `src/lib/notifications.ts` — template placeholders
- `src/lib/otp-rate-limit.ts` — staff email OTP rate buckets
- `packages/api/src/staff-pin-auth.server.ts` — PIN validation (login, screen lock)
- `packages/api/src/staff-pin-reset.server.ts` — forgot-PIN reset
- `src/components/admin/onboarding/admin-login-page.test.tsx` — PIN login UI
- `src/components/staff-screen-lock.test.tsx` — lock overlay
- `src/components/ui/button.test.tsx` — RTL smoke test

Fixtures live in `tests/fixtures/` (no database required).

## E2E tests (Playwright)

E2E needs a running dev server, applied migrations (Chunks 3–12+), at least one **visible in-stock product**, and a staff account.

Add to `.env` (do not commit):

```env
E2E_ADMIN_EMAIL=owner@yourdomain.com
E2E_ADMIN_PIN=123456
# optional — defaults to http://localhost:5173 (storefront)
# E2E_BASE_URL=http://localhost:5173
# E2E_ADMIN_BASE_URL=http://localhost:5174   # Kate Admin standalone (admin E2E project)
# optional destructive forgot-PIN flow (paste OTP from Gmail after send step)
# E2E_STAFF_FORGOT_PIN_CODE=123456
# E2E_STAFF_NEW_PIN=654321
```

First-time setup (browser binaries):

```bash
npx playwright install chromium
```

```bash
npm run test:e2e              # all projects (storefront + admin)
npm run test:e2e:admin        # Kate Admin PIN auth only (port 5174)
npm run test:e2e:admin:mobile # mobile parity (C10)
npm run test:e2e:ui           # interactive UI mode
```

**Specs:**
| File | Flow |
|------|------|
| `e2e/admin-auth.spec.ts` | PIN login, wrong PIN, forgot-PIN wizard, screen lock, settings security |
| `e2e/admin-login.spec.ts` | Staff sign-in smoke |
| `e2e/admin-mobile-parity.spec.ts` | Kate Admin mobile routes (C10) |
| `e2e/critical-flow.spec.ts` | Shop → cart → checkout → confirmation → record payment → mark packed |
| `e2e/progressive-customer.spec.ts` | Checkout session → `/orders` history; track by reference without login |

If `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PIN` are unset, credential-gated specs **skip** automatically. The public login UI spec still runs without secrets.

## CI (Chunk 17)

Workflow: `.github/workflows/ci.yml`

| Step | Command |
|------|---------|
| Lint | `npm run lint` |
| Unit tests | `npm test` |
| Build | `npm run build` (placeholder Supabase env in `check` job) |
| E2E (optional) | `npm run test:e2e` when repo variable `E2E_ENABLED=true` |

E2E job installs Chromium with `npx playwright install --with-deps chromium`. See [docs/DEPLOY.md](DEPLOY.md) for GitHub secrets.
