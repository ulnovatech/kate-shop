# Deploy contract (Chunk 17)

Kate shop deploys as a **Cloudflare Worker** (Nitro `cloudflare-module` preset). No mock data — only environment variables change between preview and production.

## Local contract

```bash
git clone <repo>
cp .env.example .env   # fill Supabase keys + APP_ORIGIN
npm install
npm run supabase:verify
npm run build          # storefront → apps/storefront/dist
npm run deploy         # needs CLOUDFLARE_API_TOKEN + account access
```

Build output: `apps/storefront/dist/` (Worker in `apps/storefront/dist/server/`, static assets in `apps/storefront/dist/client/`).

`vite.config.ts` at repo root is the **legacy monolith** (`npm run build:monolith`). Production shop builds use `apps/storefront/vite.config.ts`.

## Primary host: Cloudflare Workers

1. Create an [API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) with **Workers Scripts: Edit**.
2. Note your **Account ID** (Cloudflare dashboard).
3. Set runtime env on the Worker (via `scripts/prepare-deploy.mjs` + GitHub secrets, or Dashboard → Worker → Settings → Variables).

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_SUPABASE_URL` | Yes | Baked into client bundle at build time |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Baked into client bundle |
| `VITE_SUPABASE_PROJECT_ID` | Recommended | |
| `SUPABASE_URL` | Yes | SSR / server functions |
| `SUPABASE_PUBLISHABLE_KEY` | Yes | SSR |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Worker **secret** (never `VITE_`) |
| `APP_ORIGIN` | Yes in prod | Public shop URL, e.g. `https://shop.example.com` |
| `ADMIN_ORIGIN` | Yes when admin deployed | Staff app URL, e.g. `https://admin.example.com` |
| `VITE_ADMIN_ORIGIN` | Yes for admin build | Same as `ADMIN_ORIGIN` (client bundle) |
| `BOOTSTRAP_TOKEN` | Prod recommended | Locks `/admin/setup` |
| `CLOUDFLARE_WORKER_NAME` | Optional | Shop worker; defaults to `kate-shop` |
| `CLOUDFLARE_ADMIN_WORKER_NAME` | Optional | Admin worker; defaults to `kate-admin` (C6) |

### Manual deploy

```bash
# After build — inject vars from your shell / .env
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
export APP_ORIGIN=https://your-domain.com
# ... Supabase vars ...

npm run deploy
```

Preview a Worker locally:

```bash
npm run build
npm run preview:worker
```

### Supabase auth redirects

Add your production (and preview) URLs in Supabase → Authentication → URL configuration:

- **Site URL:** `https://your-domain.com`
- **Redirect URLs:** `https://your-domain.com/**`, preview Worker URLs if used

## Kate Admin subdomain (C6)

Staff app deploys to **`https://admin.your-domain.com`** as Worker `kate-admin`. Full guide: **[DEPLOY_ADMIN.md](DEPLOY_ADMIN.md)**.

| Host | Worker | Deploy |
|------|--------|--------|
| `shop.example.com` | `kate-shop` | `npm run deploy` |
| `admin.example.com` | `kate-admin` | `npm run deploy:admin` |

Both:

```bash
npm run deploy:all
```

Supabase redirect allowlist must include **both** origins — run `npm run supabase:redirects` with env set.

## Alternative: Vercel (documented, not automated)

TanStack Start + Nitro can target other presets. To try Vercel:

```bash
NITRO_PRESET=vercel npm run build
npx vercel deploy --prebuilt
```

Set the same `VITE_*` and `SUPABASE_*` env vars in the Vercel project. Map `SUPABASE_SERVICE_ROLE_KEY` as a server-only secret. Use Vercel preview URLs in Supabase redirect allowlist.

Cloudflare remains the **primary** path (`npm run deploy`, `.github/workflows/ci.yml`).

## GitHub Actions

Workflow: `.github/workflows/ci.yml`

| Job | When | Purpose |
|-----|------|---------|
| `check` | Every push / PR | `lint` → `test` → `build` (placeholder Supabase env) |
| `deploy-production` | Push to `main` | Build with real secrets → deploy Worker |
| `deploy-preview` | PR (optional) | Deploy `kate-shop-pr-<number>` when `CLOUDFLARE_DEPLOY_PREVIEWS=true` |
| `e2e` | Push to `main` (optional) | Playwright when `E2E_ENABLED=true` |

### GitHub `production` environment

Create **Settings → Environments → production**. Recommended:

- **Required reviewers** — manual approval before deploy (documented gate).
- **Environment secrets** — same names as `.env` plus Cloudflare:

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Deploy |
| `CLOUDFLARE_ACCOUNT_ID` | Deploy |
| `VITE_SUPABASE_URL` | Build + runtime |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Build + runtime |
| `VITE_SUPABASE_PROJECT_ID` | Build + runtime |
| `SUPABASE_URL` | Build + runtime |
| `SUPABASE_PUBLISHABLE_KEY` | Build + runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker secret |
| `BOOTSTRAP_TOKEN` | Optional setup lock |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PIN` | Optional E2E job |

| Variable | Purpose |
|----------|---------|
| `APP_ORIGIN` | Production shop URL (environment URL + Worker var) |
| `ADMIN_ORIGIN` | Production admin URL — enables `deploy-admin-production` CI |
| `CLOUDFLARE_WORKER_NAME` | Override default `kate-shop` |
| `CLOUDFLARE_ADMIN_WORKER_NAME` | Override default `kate-admin` |
| `CLOUDFLARE_ZONE_NAME` | Optional — auto wrangler routes for shop/admin hostnames |
| `CLOUDFLARE_DEPLOY_PREVIEWS` | Set `true` to enable PR preview Workers |
| `E2E_ENABLED` | Set `true` to run Playwright on `main` |

CI **fails closed**: any lint, test, or build failure blocks deploy.

## Health / uptime (Chunk 18)

After deploy, point an uptime monitor at:

```text
https://your-domain.com/health.json
```

Expect HTTP 200 with `"status": "healthy"` or `"degraded"` (Supabase unreachable). `"unhealthy"` returns 503.

Local smoke test:

```bash
node scripts/health-check.mjs http://localhost:5173/health.json
```

See [docs/OBSERVABILITY.md](OBSERVABILITY.md) for log format and request correlation (`X-Request-Id`).
