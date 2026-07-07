# Kate Admin — mobile parity QA (C10)

APK and mobile browser should match the staff web app across **23 routes**. This doc is the human checklist; automation lives in `e2e/admin-mobile-parity.spec.ts` and `npm run verify:admin-routes`.

## Route matrix

| Area        | Route           | Path                     | Mobile notes                               |
| ----------- | --------------- | ------------------------ | ------------------------------------------ |
| **Auth**    | join            | `/join`                  | No invite bound — ask owner for link       |
|             | signup          | `/signup`                | Email + PIN signup (invite bound silently) |
|             | login           | `/login`                 | Returning staff PIN sign-in                |
|             | setup           | `/setup`                 | Owner bootstrap (once)                     |
|             | accept-invite   | `/accept-invite?token=…` | Probes for APK; install gate or signup     |
| **Home**    | dashboard       | `/`                      | Today + bottom quick nav                   |
|             | insights        | `/insights`              | Charts scroll horizontally                 |
| **Catalog** | products        | `/products`              | Card list; add product CTA                 |
|             | product-new     | `/products/new`          | Sticky save; camera capture                |
|             | product-edit    | `/products/:id`          | Gallery upload; sticky save                |
|             | categories      | `/categories`            | Drag reorder; expand tree                  |
| **Orders**  | orders          | `/orders`                | Stacked filters; CSV export                |
|             | order-detail    | `/orders/:id`            | Status pipeline first                      |
|             | delivery        | `/delivery`              | Zone toggles                               |
| **Money**   | payments        | `/payments`              | Inline record form                         |
|             | payment-methods | `/payment-methods`       | Toggle methods                             |
| **Ops**     | notifications   | `/notifications`         | List readable on narrow screens            |
|             | recycle         | `/recycle`               | Restore / purge actions                    |
|             | audit           | `/audit`                 | Filter + scroll                            |
| **Team**    | team            | `/team`                  | Invite form                                |
|             | roles           | `/roles`                 | Permission matrix scroll                   |
|             | account         | `/account`               | PIN, email, recovery password              |
|             | settings        | `/settings`              | Store setup sections                       |

Source of truth: [`packages/domain/src/admin-route-catalog.ts`](../packages/domain/src/admin-route-catalog.ts).

## Automated checks

```bash
# Route files ↔ catalog ↔ sync map
npm run verify:admin-routes

# Unit tests (catalog + WebView helpers)
npx vitest run packages/domain/src/admin-route-catalog.test.ts src/lib/download-text.test.ts

# Playwright — Pixel 7 viewport against apps/admin (port 5174)
# Requires E2E_ADMIN_EMAIL + E2E_ADMIN_PIN in .env
npm run test:e2e:admin:mobile
```

## Manual device pass (Android)

Use **Chrome on `admin.yourdomain.com`** and the **Kate Admin APK** (`npm run android:admin`).

### Shell & chrome

- [ ] Bottom quick nav visible (Orders, Products, Payments, Menu)
- [ ] Slide-out menu opens; all nav sections reachable
- [ ] No horizontal page overflow on any route
- [ ] Offline banner appears when airplane mode on (online-only messaging)
- [ ] Shop install prompt never appears on admin origin

### Auth & session

- [ ] Fresh install / logged out → **Join** screen (not PIN login)
- [ ] **Android browser — APK already installed:** invite link opens app → signup (no download prompt)
- [ ] **Android browser — no APK:** invite link shows **Download Kate Admin** (not forced re-download if app present)
- [ ] Invite link → email + PIN signup in browser (Continue in browser escape hatch)
- [ ] Returning staff: Join → Sign in → PIN works
- [ ] Logout → join screen
- [ ] Session survives app background / resume
- [ ] Invite link opens accept-invite (web or APK)

### Catalog & media

- [ ] Product photo: **Camera** and **Gallery** on Android
- [ ] Category drag reorder works with touch
- [ ] Product save sticky bar not hidden behind bottom nav

### Orders & exports

- [ ] Order list filters usable one-handed
- [ ] Order detail status actions full-width on mobile
- [ ] **Export CSV** triggers download (or share sheet) in WebView

### Clipboard & sharing

- [ ] Copy actions degrade gracefully when clipboard blocked (toast, not silent fail)

## WebView fixes included in C10

| Issue                         | Fix                                              |
| ----------------------------- | ------------------------------------------------ |
| CSV download flaky in WebView | `downloadTextFile()` appends transient `<a>`     |
| Clipboard denied in WebView   | `copyTextToClipboard()` `execCommand` fallback   |
| Shop SW on admin origin       | C9 `StaffPwaPolicy` (evict caches)               |
| Touch targets                 | A10 `admin-mobile.ts` classes on primary actions |

## When something fails

1. Reproduce on **mobile Chrome** first (narrower than desktop).
2. If APK-only, re-sync: `npm run android:admin:sync`.
3. Update heading text in `admin-route-catalog.ts` if copy changed.
4. Run `npm run sync:admin-routes` after monolith route edits.

## Related

- [ADMIN_MOBILE.md](ADMIN_MOBILE.md) — Capacitor shell
- [ADMIN_PWA.md](ADMIN_PWA.md) — staff install identity
- [ADMIN_APP.md](ADMIN_APP.md) — blueprint chunks C12+ (Play Store)
