# Kate Admin Android (C7)

Capacitor shell in [`apps/admin-mobile`](../apps/admin-mobile/) — loads the staff web app from `ADMIN_ORIGIN` in a native WebView.

## Architecture

```text
Kate Admin APK (com.kate.admin)
  └── WebView → https://admin.yourdomain.com
        └── same TanStack Start app as apps/admin (Cloudflare Worker kate-admin)
```

No forked API. No service role key in the APK.

## Prerequisites

- Node 20+ and `npm install` at repo root
- [Android Studio](https://developer.android.com/studio) with SDK Platform 34+
- JDK 17 (bundled with Android Studio)

## Local dev (emulator)

Terminal 1 — admin web:

```bash
npm run dev:admin
```

Terminal 2 — sync and run APK:

```bash
ADMIN_MOBILE_SERVER_URL=http://10.0.2.2:5174 npm run android:admin:sync
npm run android:admin
```

`10.0.2.2` is the Android emulator alias for the host machine’s `localhost`.

Physical device on the same LAN: use your machine’s IP, e.g. `http://192.168.1.10:5174`.

## Production APK

Deploy admin first ([DEPLOY_ADMIN.md](DEPLOY_ADMIN.md)), then:

```bash
ADMIN_ORIGIN=https://admin.yourdomain.com npm run build:admin-apk
```

Versioned APK: `dist/admin-mobile/kate-admin-<version>-<code>-debug.apk`

Signed release: `npm run build:admin-apk:release` — see [ADMIN_APK_RELEASE.md](ADMIN_APK_RELEASE.md).

CI uploads artifacts on push to `main` when `ADMIN_ORIGIN` is configured.

Release signing and Play Store upload are **C12**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run android:admin` | Sync + run on device/emulator |
| `npm run android:admin:sync` | `cap sync android` only |
| `npm run android:admin:open` | Open `apps/admin-mobile` in Android Studio |
| `npm run android:admin:build` | `assembleDebug` |

## Server URL resolution

First non-empty value wins:

1. `ADMIN_MOBILE_SERVER_URL` — emulator / LAN override
2. `VITE_ADMIN_ORIGIN`
3. `ADMIN_ORIGIN`
4. Default `http://localhost:5174`

Configured in [`apps/admin-mobile/capacitor.config.ts`](../apps/admin-mobile/capacitor.config.ts).

## Supabase

Staff auth redirect URLs include the APK deep link `com.kate.admin://login-callback` (C8).

```bash
npm run supabase:redirects
```

Password sign-in works in the WebView. OAuth and magic-link flows return via `/login-callback` (web) or the mobile deep link (APK).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank WebView | Confirm `npm run dev:admin` is running; re-sync with correct `ADMIN_MOBILE_SERVER_URL` |
| Cleartext HTTP blocked | HTTP URLs enable `cleartext` in Capacitor config automatically; use HTTPS in production |
| `cap add android` fails | Install Android SDK; set `ANDROID_HOME` |
| Stale URL in APK | Run `npm run android:admin:sync` after changing env |

## Related

- [ADMIN_APP.md](ADMIN_APP.md) — blueprint chunks C8–C12
- [DEPLOY_ADMIN.md](DEPLOY_ADMIN.md) — admin Worker deploy
