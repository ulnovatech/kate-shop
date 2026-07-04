# Kate Shop (storefront)

Customer-facing TanStack Start app — shop, checkout, accounts, and shop PWA.

**Status:** Scaffolded in blueprint **C5**. Routes live here; shared libs/components import from root `src/` and `packages/*`.

## Local development

Run shop and admin in separate terminals:

```bash
# Terminal 1 — storefront (port 5173)
npm run dev
# or: npm run dev:storefront

# Terminal 2 — Kate Admin (port 5174)
npm run dev:admin
```

Open [http://localhost:5173](http://localhost:5173) for the shop.

The legacy monolith (shop + `/admin` on one server) is still available:

```bash
npm run dev:monolith   # port 5173, includes /admin routes
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Storefront dev server (5173) |
| `npm run build` | Storefront production build → `apps/storefront/dist` |
| `npm run build:all` | Storefront + admin builds |
| `npm run sync:storefront-routes` | Copy shop routes from `src/routes/` |

## Routes

```
apps/storefront/src/routes/
  __root.tsx              # shop providers + PWA
  index.tsx, shop.tsx, cart.tsx, checkout.tsx, …
  manifest[.]webmanifest.ts
  sitemap[.]xml.ts, robots[.]txt.ts, health[.]json.ts
```

Admin routes are **not** included — use `apps/admin` on port 5174.

## Deploy

Production deploy uses the storefront build:

```bash
npm run deploy   # build:storefront → prepare-deploy → nitro deploy
```

Wrangler output: `apps/storefront/dist/server/`.

## Related

- [docs/ADMIN_APP.md](../../docs/ADMIN_APP.md)
- [apps/admin](../admin/) — staff app (5174)
