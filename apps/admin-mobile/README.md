# Kate Admin Mobile (APK)

Thin **Capacitor** Android shell that loads the Kate Admin web app from `ADMIN_ORIGIN`.

**Package id:** `com.kate.admin`

## Quick start

1. Install deps at repo root: `npm install`
2. Start admin dev server: `npm run dev:admin` (port 5174)
3. **Emulator:** sync with host loopback, then run:

```bash
ADMIN_MOBILE_SERVER_URL=http://10.0.2.2:5174 npm run android:admin:sync
npm run android:admin
```

4. **Production APK (C11):**

```bash
ADMIN_ORIGIN=https://admin.yourdomain.com npm run build:admin-apk
```

Output: `dist/admin-mobile/kate-admin-<version>-<code>-debug.apk`

Legacy Gradle output only: `npm run android:admin:build`

## Scripts (root)

| Script                            | Action                                           |
| --------------------------------- | ------------------------------------------------ |
| `npm run android:admin`           | `cap sync` + `cap run android`                   |
| `npm run android:admin:sync`      | Write server URL into native project             |
| `npm run android:admin:open`      | Open Android Studio                              |
| `npm run android:admin:build`     | `assembleDebug` in Gradle output dir             |
| `npm run build:admin-apk`         | Versioned debug APK → `dist/admin-mobile/` (C11) |
| `npm run build:admin-apk:release` | Signed release APK (keystore env)                |

## Environment

| Variable                             | Purpose                                              |
| ------------------------------------ | ---------------------------------------------------- |
| `ADMIN_MOBILE_SERVER_URL`            | Override load URL (emulator: `http://10.0.2.2:5174`) |
| `VITE_ADMIN_ORIGIN` / `ADMIN_ORIGIN` | Admin web URL (production or local)                  |

The APK does **not** bundle the admin app or `SUPABASE_SERVICE_ROLE_KEY` — it is a WebView pointed at your deployed admin Worker.

## Requirements

- [Android Studio](https://developer.android.com/studio) + SDK (API 24+)
- JDK 17+
- USB debugging or emulator for `android:admin`

## Docs

- [docs/ADMIN_MOBILE.md](../../docs/ADMIN_MOBILE.md) — full C7 guide
- [docs/ADMIN_MOBILE_QA.md](../../docs/ADMIN_MOBILE_QA.md) — C10 route parity checklist
- [docs/ADMIN_APK_RELEASE.md](../../docs/ADMIN_APK_RELEASE.md) — CI artifacts + versioning (C11)
- [docs/ADMIN_PWA.md](../../docs/ADMIN_PWA.md) — staff install identity (C9)
