# Environment variables (Chunk 1)

All environments (local, preview, production) use the **same variable names**. Only values change.

| Variable                        | Where used                | Required              | Notes                                                          |
| ------------------------------- | ------------------------- | --------------------- | -------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Browser build             | Yes                   | Project URL                                                    |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser build             | Yes                   | Publishable or `anon` key                                      |
| `VITE_SUPABASE_PROJECT_ID`      | Tooling / reference       | Recommended           | Project ref from URL hostname                                  |
| `SUPABASE_URL`                  | SSR / server              | Yes                   | Same as `VITE_SUPABASE_URL`                                    |
| `SUPABASE_PUBLISHABLE_KEY`      | SSR / server              | Yes                   | Same as `VITE_SUPABASE_PUBLISHABLE_KEY`                        |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server only               | Yes for admin scripts | **Never** prefix with `VITE_`                                  |
| `DATABASE_URL`                  | `npm run db:migrate` only | Optional              | Direct Postgres for applying SQL migrations                    |
| `APP_ORIGIN`                    | Shop deploy, invite links | Prod recommended      | Public storefront URL                                          |
| `ADMIN_ORIGIN`                  | Admin deploy, staff links | When admin live       | Staff subdomain, e.g. `https://admin.example.com`              |
| `VITE_ADMIN_ORIGIN`             | Admin client build        | When admin live       | Same as `ADMIN_ORIGIN`                                         |
| `ADMIN_MOBILE_SERVER_URL`       | Capacitor APK (C7)        | Optional              | Emulator/LAN override, e.g. `http://10.0.2.2:5174`             |
| `CLOUDFLARE_ADMIN_WORKER_NAME`  | Admin deploy              | Optional              | Defaults to `kate-admin` (C6)                                  |
| `CLOUDFLARE_ZONE_NAME`          | Shop + admin deploy       | Optional              | Auto wrangler routes when zone is on Cloudflare (C6)           |
| `KATE_RELEASE_VERSION`          | APK CI / local build      | Optional              | Overrides `apps/admin-mobile/release.json` `versionName` (C11) |
| `BUILD_ADMIN_APK_RELEASE`       | GitHub Actions            | Optional              | Set `true` to also build signed release APK (C11)              |
| `BUILD_ADMIN_AAB`               | GitHub Actions            | Optional              | Set `true` to also build signed release AAB for Play (C12)     |
| `STAFF_PUSH_ENABLED`            | Admin Worker server       | Optional              | `true` to dispatch FCM on new orders (C12)                     |
| `FCM_SERVER_KEY`                | Admin Worker server       | When push enabled     | Firebase Cloud Messaging server key (C12)                      |

## Local setup

```bash
cp .env.example .env
# Edit .env with your Supabase project keys
npm install
npm run supabase:verify
npm run dev
```

## Deploy hosts

**Primary:** Cloudflare Workers — see [docs/DEPLOY.md](DEPLOY.md) for the full contract and GitHub secrets matrix.

Set the same variable **names** in GitHub Environments (`production`, optional `preview`) or your host dashboard. Never expose `SUPABASE_SERVICE_ROLE_KEY` via `VITE_*` or client bundles.

| Host                 | Build                               | Deploy                                               |
| -------------------- | ----------------------------------- | ---------------------------------------------------- |
| Cloudflare Workers   | `npm run build`                     | `npm run deploy` or GHA `deploy-production` job      |
| Vercel (alternative) | `NITRO_PRESET=vercel npm run build` | `vercel deploy --prebuilt` — manual; not wired in CI |

Also set `APP_ORIGIN` to the public site URL in production (canonical links, invite emails, sitemap).

For Kate Admin (staff subdomain + APK), also set `ADMIN_ORIGIN` and `VITE_ADMIN_ORIGIN`. See [docs/ADMIN_APP.md](ADMIN_APP.md), [docs/ADMIN_MOBILE.md](ADMIN_MOBILE.md), [docs/ADMIN_APK_RELEASE.md](ADMIN_APK_RELEASE.md), [docs/ADMIN_PLAY_STORE.md](ADMIN_PLAY_STORE.md), and [docs/ADMIN_STAFF_PUSH.md](ADMIN_STAFF_PUSH.md).

GitHub secrets for signed release APK (C11): `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, optional `ANDROID_KEY_PASSWORD`.

Staff push (C12): add `STAFF_PUSH_ENABLED` and `FCM_SERVER_KEY` to the admin Worker secrets. Place `google-services.json` in `apps/admin-mobile/android/app/` locally (gitignored).

## Staff email OTP (auth chunk 18)

| Variable             | Where  | Required   | Notes                                      |
| -------------------- | ------ | ---------- | ------------------------------------------ |
| `EMAIL_OTP_PROVIDER` | Server | Optional   | `gmail`, `console`, or `noop` (default)    |
| `GMAIL_USER`         | Server | When Gmail | Gmail address for SMTP                     |
| `GMAIL_APP_PASSWORD` | Server | When Gmail | Google App Password (not account password) |

## Admin mobile one-click publish

| Variable / secret       | Where  | Required | Notes                                                                           |
| ----------------------- | ------ | -------- | ------------------------------------------------------------------------------- |
| `GITHUB_REPO`           | Server | Optional | Defaults to `ulnovatech/kate-shop`                                              |
| `KATE_GH_RELEASE_TOKEN` | Server | Optional | PAT with Actions write — GitHub production secret (cannot start with `GITHUB_`) |

Owner UI: **Settings → Mobile app → Publish update to staff**. See [ADMIN_MOBILE_UPDATES.md](ADMIN_MOBILE_UPDATES.md).

Apply migration:

```bash
npm run db:chunk18-email
```

Server functions: `requestStaffEmailOtp`, `verifyStaffEmailOtp`, `getStaffEmailOtpDeliveryStatus`.

## Staff screen lock (auth chunk 22)

| Variable                         | Where        | Required | Notes                          |
| -------------------------------- | ------------ | -------- | ------------------------------ |
| `VITE_STAFF_SCREEN_LOCK_IDLE_MS` | Admin client | Optional | Idle auto-lock (default 5 min) |

Locks on app background / idle; unlock with PIN via `verifyScreenLockPin`.

## Staff owner PIN ops (auth chunk 23)

| Variable                  | Where              | Required     | Notes                                       |
| ------------------------- | ------------------ | ------------ | ------------------------------------------- |
| `STAFF_OWNER_INITIAL_PIN` | Server script only | One-time ops | 5 digits; run `npm run staff:set-owner-pin` |

Never commit the PIN value. Clears lockout counters when applied.

## Observability (Chunk 18)

No new env vars. Health checks use existing `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` at runtime. Without the service role key, `checks.supabase` is `skipped` (still HTTP 200).

See [docs/OBSERVABILITY.md](OBSERVABILITY.md).
