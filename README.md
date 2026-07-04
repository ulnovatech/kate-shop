# Kate shop

Production ecommerce (TanStack Start + Supabase, Kampala / UGX).

## Quick start

```bash
cp .env.example .env
npm install
npm run supabase:verify
npm run dev
```

- Environment: [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)
- Supabase migrations: [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)
- Tests: [docs/TESTING.md](docs/TESTING.md)
- Deploy: [docs/DEPLOY.md](docs/DEPLOY.md)

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | All dev servers: storefront `:5173`, admin `:5174`, monolith `:5175` |
| `npm run dev:storefront` | Storefront only (`http://localhost:5173`) |
| `npm run dev:admin` | Standalone admin only (`http://localhost:5174`) |
| `npm run dev:monolith` | Monolith shop + `/admin` (`http://localhost:5175`) |
| `npm run build` | Production build (Cloudflare Worker via Nitro) |
| `npm run deploy` | Deploy prebuilt `dist/` to Cloudflare |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E (optional credentials) |
| `npm run lint` | ESLint + Prettier |

## CI/CD

Push to `main` runs lint, test, and build in GitHub Actions. Production deploy to Cloudflare Workers runs after a green `check` job (configure the `production` environment — see [docs/DEPLOY.md](docs/DEPLOY.md)).
