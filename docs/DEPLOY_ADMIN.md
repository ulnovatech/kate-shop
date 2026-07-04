# Deploy Kate Admin (C6)

Staff app at `https://admin.yourdomain.com` — separate Cloudflare Worker from the shop.

## Prerequisites

1. Shop deployed (`npm run deploy`) with `APP_ORIGIN` set.
2. DNS: `admin` subdomain (or separate hostname) pointing to Cloudflare.
3. Same Supabase project as the storefront.

## Environment

```bash
# .env or shell
APP_ORIGIN=https://shop.yourdomain.com
ADMIN_ORIGIN=https://admin.yourdomain.com
VITE_ADMIN_ORIGIN=https://admin.yourdomain.com   # baked into admin client build
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_ADMIN_WORKER_NAME=kate-admin          # optional
CLOUDFLARE_ZONE_NAME=yourdomain.com              # optional — auto wrangler route
```

## Deploy

```bash
npm run build:admin    # or let deploy:admin build for you
npm run deploy:admin
```

Deploy both workers:

```bash
npm run deploy:all
```

Preview admin Worker locally (after `npm run build:admin`):

```bash
npm run preview:admin:worker
```

## Cloudflare custom domain

**Option A — automatic route** (zone on same account):

Set `CLOUDFLARE_ZONE_NAME=yourdomain.com` and `ADMIN_ORIGIN=https://admin.yourdomain.com` before `prepare-deploy`. Wrangler receives a route pattern `admin.yourdomain.com/*`.

**Option B — dashboard** (manual):

1. Workers & Pages → `kate-admin` → Settings → Domains & Routes.
2. Add custom domain `admin.yourdomain.com`.
3. Confirm DNS CNAME/proxy in Cloudflare DNS.

## Supabase Authentication

In Supabase → **Authentication** → **URL configuration**:

| Field | Value |
|-------|--------|
| **Site URL** | `https://shop.yourdomain.com` (`APP_ORIGIN`) |
| **Redirect URLs** | `https://shop.yourdomain.com/**` |
| | `https://admin.yourdomain.com/**` |

Print URLs from your env:

```bash
APP_ORIGIN=https://shop.example.com ADMIN_ORIGIN=https://admin.example.com npm run supabase:redirects
```

Staff invite links use `ADMIN_ORIGIN/accept-invite?token=…` when `ADMIN_ORIGIN` is set (standalone admin). Without it, invites fall back to `APP_ORIGIN/admin/accept-invite` (monolith).

Mobile APK (C8): `com.kate.admin://login-callback` is included in `npm run supabase:redirects`.

Build the APK shell (C7): [ADMIN_MOBILE.md](ADMIN_MOBILE.md).

## GitHub Actions

When `ADMIN_ORIGIN` is set as a **repository/organization variable**, push to `main` runs:

- `deploy-production` → shop Worker (`kate-shop`)
- `deploy-admin-production` → admin Worker (`kate-admin`)

Optional variables:

| Variable | Purpose |
|----------|---------|
| `ADMIN_ORIGIN` | Enables admin deploy job + worker env |
| `CLOUDFLARE_ADMIN_WORKER_NAME` | Override default `kate-admin` |
| `CLOUDFLARE_ZONE_NAME` | Auto-inject wrangler route for shop + admin |

## Health

Admin app exposes the same mother-system health endpoint:

```text
https://admin.yourdomain.com/health.json
```

## Related

- [DEPLOY.md](DEPLOY.md) — storefront Worker
- [ADMIN_APP.md](ADMIN_APP.md) — architecture + chunk roadmap
- [ENVIRONMENT.md](ENVIRONMENT.md) — full env matrix
