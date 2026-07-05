# Deploy via GitHub Actions (recommended)

Use **GitHub Actions only**. You do **not** need to configure build/deploy variables in the Cloudflare Workers Builds UI — that path duplicates what CI already does and is easy to misconfigure.

## One-time setup

### 1. Disable Cloudflare Workers Builds (optional but recommended)

Cloudflare dashboard → **Workers & Pages** → your connected repo → **Settings** → disconnect or pause **Workers Builds** if you enabled it.

GitHub Actions (`.github/workflows/ci.yml`) is the source of truth: push to `main` → lint/test/build → deploy Worker.

### 2. Create GitHub `production` environment

GitHub repo → **Settings** → **Environments** → **New environment** → name it `production`.

Add these **Secrets** (copy values from your local `.env` — same names):

| Secret                          | From `.env`                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CLOUDFLARE_API_TOKEN`          | Create at [Cloudflare API tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) — template **Edit Cloudflare Workers** |
| `CLOUDFLARE_ACCOUNT_ID`         | Cloudflare dashboard → Workers → right sidebar **Account ID**                                                                                          |
| `VITE_SUPABASE_URL`             | ✓                                                                                                                                                      |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✓                                                                                                                                                      |
| `VITE_SUPABASE_PROJECT_ID`      | ✓                                                                                                                                                      |
| `SUPABASE_URL`                  | ✓ (same as `VITE_SUPABASE_URL`)                                                                                                                        |
| `SUPABASE_PUBLISHABLE_KEY`      | ✓ (same as `VITE_SUPABASE_PUBLISHABLE_KEY`)                                                                                                            |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✓ (service role JWT — **never** `VITE_`)                                                                                                               |
| `BOOTSTRAP_TOKEN`               | Optional — locks `/admin/setup`                                                                                                                        |

Add these **Variables** (not secrets — plain text URLs):

| Variable                       | Example                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `APP_ORIGIN`                   | `https://kate-shop.ulnovatech.workers.dev`                                   |
| `ADMIN_ORIGIN`                 | `https://kate-admin.ulnovatech.workers.dev` (set when ready to deploy admin) |
| `CLOUDFLARE_WORKER_NAME`       | `kate-shop` (optional; this is the default)                                  |
| `CLOUDFLARE_ADMIN_WORKER_NAME` | `kate-admin` (optional; this is the default)                                 |

Shop and admin deploy jobs both use the **`production`** environment — one set of secrets, no duplicate `production-admin` environment.

### 3. Supabase auth redirects

Supabase → **Authentication** → **URL configuration**:

- **Site URL:** your `APP_ORIGIN`
- **Redirect URLs:** `https://kate-shop.ulnovatech.workers.dev/**`

## Day-to-day deploy

```bash
git add .
git commit -m "your message"
git push origin main
```

That’s it. No `npm run deploy` locally. No Cloudflare build variables.

Watch progress: GitHub → **Actions** → workflow **CI/CD** → latest run on `main`.

Successful run shows:

1. **Lint, test, build** — must pass first
2. **Deploy production** — shop Worker (`kate-shop`)
3. **Deploy admin production** — admin Worker (`kate-admin`) on every push to `main` (defaults to `https://kate-admin.ulnovatech.workers.dev` if `ADMIN_ORIGIN` is unset)

Both deploy jobs use the same GitHub **`production`** environment (shared secrets and variables).

## Verify after deploy

```bash
curl https://kate-shop.ulnovatech.workers.dev/health.json
```

Expect HTTP **200** and `"status": "healthy"` or `"degraded"`.

## Troubleshooting

| Symptom                             | Fix                                                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Deploy job skipped                  | Push must be to `main`, not a branch                                                                                        |
| **Deploy admin production skipped** | Was caused by `ADMIN_ORIGIN` gate — admin now deploys on every `main` push. Set `ADMIN_ORIGIN` in **production** variables to override the default URL. |
| Deploy job missing                  | `check` job failed — open the run and fix lint/test/build                                                                   |
| Worker still 500 after green deploy | Open Cloudflare → Worker → **Logs** (enabled by `prepare-deploy.mjs`)                                                       |
| `CLOUDFLARE_API_TOKEN` invalid      | Token needs **Account → Workers Scripts → Edit**                                                                            |
| Secrets not found                   | Secrets must be on the **`production`** environment, not only repo-level (both work, but CI uses `environment: production`) |

## What CI does (you don’t run this manually)

```
npm ci
npm run build:storefront          # VITE_* baked in here
node scripts/prepare-deploy.mjs   # wrangler.json vars + observability
wrangler deploy                   # + secret SUPABASE_SERVICE_ROLE_KEY
```

See also [DEPLOY.md](DEPLOY.md) for the full variable reference.
