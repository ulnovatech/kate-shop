# Observability (Chunk 18)

Production logging, health checks, and client error reporting for Kate shop on Cloudflare Workers.

## Health check

```bash
curl -s http://localhost:5173/health.json | jq
```

Response shape:

```json
{
  "status": "healthy",
  "service": "kate-shop",
  "version": "0.0.0",
  "uptimeSeconds": 42,
  "checks": { "app": "ok", "supabase": "ok" },
  "timestamp": "2026-06-05T12:00:00.000Z"
}
```

| `checks.supabase` | Meaning                                                         |
| ----------------- | --------------------------------------------------------------- |
| `ok`              | Settings row readable via service role                          |
| `error`           | Supabase unreachable or query failed → overall `degraded`       |
| `skipped`         | No `SUPABASE_SERVICE_ROLE_KEY` at runtime (e.g. CI build smoke) |

Paths: `/health.json` (JSON) and `/health` (same handler via Worker entry).

Use for uptime monitors (UptimeRobot, Better Stack, Cloudflare Health Checks).

## Structured logs

Every request through `src/server.ts` emits one JSON line:

```json
{
  "level": "info",
  "event": "request",
  "ts": "...",
  "requestId": "...",
  "method": "GET",
  "path": "/",
  "status": 200,
  "durationMs": 45
}
```

Errors emit `event: "server_error"` or `event: "client_error"`.

**Where to read logs**

- Local: terminal running `npm run dev` / `npm run preview:worker`
- Production: Cloudflare dashboard → Workers → your worker → Logs / Observability

`scripts/prepare-deploy.mjs` sets `observability.logs.enabled: true` in the generated `wrangler.json` on every deploy, so dashboard log settings are not reset to Disabled. Set `CLOUDFLARE_WORKER_LOGS=false` to skip this block (e.g. cost-sensitive preview Workers).

## Request correlation

Responses include `X-Request-Id`. Pass the same header on inbound requests to tie logs together.

## Client errors

Browser `error` and `unhandledrejection` events plus TanStack Router `errorComponent` POST to `reportClientError` (server function). Payloads are logged as structured JSON — no PII beyond URL and stack.

Implementation: `src/lib/observability/client-errors.ts`, mounted via `ClientErrorReporting` in `__root.tsx`.

## Optional uptime script

After deploy or local preview:

```bash
node scripts/health-check.mjs http://localhost:5173/health.json
```

Exit code 0 = healthy/degraded with HTTP 200; non-zero = unreachable or unhealthy.

## Sentry / external APM (Phase 2)

Chunk 18 uses Cloudflare-native logging only. To add Sentry later:

1. Create a Sentry project
2. Add `@sentry/cloudflare` for the Worker and `@sentry/react` for the client
3. Set `SENTRY_DSN` / `VITE_SENTRY_DSN` in Worker vars (never `VITE_` for secrets)

See [docs/DEPLOY.md](DEPLOY.md) for secret placement.

## Related

- SSR catastrophic error page: `src/lib/error-page.ts`, `src/lib/error-capture.ts`
- Business audit trail (not ops logs): `/admin/audit`, `audit_logs` table (Addendum A2)
