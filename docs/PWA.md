# PWA (Addendum A8)

Installable storefront with offline static assets and cached product images. Checkout and admin require a network connection.

## What works offline

- Previously visited product images (Supabase storage + same-origin images)
- JS/CSS/font bundles cached by the service worker
- Shop browse may partially work if pages were visited while online

## What stays online-only

- `/checkout`, `/order/*` — order placement and payment instructions
- `/admin/*` — staff operations

## Push notifications (Phase 2)

The service worker registers in production via `PwaRegistration`. To add push:

1. Generate VAPID keys and store server-side
2. Implement `subscribeToPushNotifications()` in `src/lib/pwa.ts`
3. Persist subscriptions in Supabase and send from a backend job

## Lighthouse / install

- Manifest: `/manifest.webmanifest` (shop name from settings)
- Icons: `public/pwa-icon.svg` (replace for production branding)
- Theme color: `#064e3b` (emerald)

Test install: deploy or `npm run build && npm run preview`, open on mobile → Add to Home Screen.

## Kate Admin (staff — C9)

Staff install is **separate** from the shop PWA:

- Manifest: `/manifest.webmanifest` on `admin.yourdomain.com` (or `/admin-manifest.webmanifest` on monolith)
- Icon: `/admin-icon.svg` — shield badge, not the shop icon
- **No service worker** on the admin Worker; shop Workbox is evicted when staff open the dedicated admin origin
- Offline: banner only — all staff actions require network

See [ADMIN_PWA.md](ADMIN_PWA.md).

## Install prompt (Phase 7 C4)

In production, repeat visitors may see a slim **Install {shopName}** banner on storefront pages:

- Shown after **2+ visits** (one count per browser session) or after a **completed checkout** (customer session saved)
- Hidden on `/checkout` and `/admin`, when already installed (standalone display mode), or after **Not now** (snoozed 14 days)
- **Chrome / Edge (Android):** captures `beforeinstallprompt` and triggers the native install dialog
- **iOS Safari:** opens a bottom sheet with Share → Add to Home Screen steps (no broken Install button)

Logic lives in `src/lib/pwa-install.ts`; UI in `src/components/pwa-install-prompt.tsx` (rendered from `ShopLayout`, positioned above the mobile tab bar when visible).

To test locally: `npm run build && npm run preview` (banner does not appear in `npm run dev`).
