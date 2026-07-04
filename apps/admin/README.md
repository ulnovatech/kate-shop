# Kate Admin (web)

Staff TanStack Start app for `admin.yourdomain.com` and the Capacitor APK WebView.

**Status:** Scaffolded in blueprint **C3**. Routes live here; shared libs/components still import from root `src/` until **C4**.

## Local development

Run the shop and admin dev servers in separate terminals:

```bash
# Terminal 1 — storefront (port 5173)
npm run dev

# Terminal 2 — Kate Admin (port 5174)
npm run dev:admin
```

Open [http://localhost:5174](http://localhost:5174) for the standalone staff app. The monolith still serves admin at [http://localhost:5173/admin](http://localhost:5173/admin) until **C5/C6**.

## Scripts

| Command                     | Description                                                    |
| --------------------------- | -------------------------------------------------------------- |
| `npm run dev:admin`         | Dev server on port 5174                                        |
| `npm run build:admin`       | Production build → `apps/admin/dist`                           |
| `npm run sync:admin-routes` | Copy `src/routes/admin*.tsx` → `apps/admin/src/routes/_staff/` |

After editing monolith admin routes, run `npm run sync:admin-routes` (or `npm run sync:routes -w @kate/admin`).

## Layout

```
apps/admin/src/
  routes/
    __root.tsx          # lean staff providers
    manifest[.]webmanifest.ts
    _staff/             # pathless layout (URLs without /admin prefix)
      route.tsx         # AdminLayout + route guard
      index.tsx         # dashboard
      login.tsx
      orders.tsx
      ...
```

Shared code is resolved via `@/*` → `../../src/*`.

## Environment

Uses the repo root `.env`. Important vars:

```bash
APP_ORIGIN=http://localhost:5173
ADMIN_ORIGIN=http://localhost:5174
VITE_ADMIN_ORIGIN=http://localhost:5174
VITE_APP_ORIGIN=http://localhost:5173   # “View shop” link from admin app
```

`apps/admin` sets `VITE_ADMIN_BASE_PATH=/` at build time so nav links use `/orders` instead of `/admin/orders`.

## Deploy

Production: **[docs/DEPLOY_ADMIN.md](../../docs/DEPLOY_ADMIN.md)**

```bash
ADMIN_ORIGIN=https://admin.yourdomain.com npm run deploy:admin
```

## Related

- [docs/ADMIN_APP.md](../../docs/ADMIN_APP.md) — north star + chunk roadmap
- [apps/admin-mobile](../admin-mobile/) — Capacitor shell (C7)
