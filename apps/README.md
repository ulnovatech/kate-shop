# Apps

Kate Shop client apps in the monorepo:

| App                | Path                | Port (local) | Status        |
| ------------------ | ------------------- | ------------ | ------------- |
| **Storefront**     | `apps/storefront`   | 5173         | ✅ C5         |
| **Kate Admin**     | `apps/admin`        | 5174         | ✅ C3         |
| **Kate Admin APK** | `apps/admin-mobile` | —            | Scaffold — C7 |

Legacy monolith (shop + `/admin` in one process): root `vite.config.ts` via `npm run dev:monolith`.

See [docs/ADMIN_APP.md](../docs/ADMIN_APP.md) for the north star and chunk roadmap.
