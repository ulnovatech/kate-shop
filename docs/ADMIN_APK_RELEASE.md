# Kate Admin APK — release & CI (C11)

Repeatable **debug APK** artifacts from GitHub Actions; optional **signed release** builds for internal distribution.

## Versioning

Source: [`apps/admin-mobile/release.json`](../apps/admin-mobile/release.json)

| Field             | Purpose                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `versionName`     | User-visible semver (e.g. `1.0.0`) — bump with shop releases     |
| `versionCodeBase` | Android `versionCode` floor (must always increase on Play Store) |

**CI `versionCode`** = `versionCodeBase` + `github.run_number`

Override per build:

```bash
KATE_RELEASE_VERSION=1.0.1 KATE_ANDROID_VERSION_BUILD=5 npm run build:admin-apk
```

Gradle reads generated `apps/admin-mobile/android/version.properties` (gitignored).

## Local builds

### Debug (team install, no keystore)

```bash
ADMIN_ORIGIN=https://admin.yourdomain.com npm run build:admin-apk
```

Output: `dist/admin-mobile/kate-admin-1.0.0-<code>-debug.apk`

Install:

```bash
adb install -r dist/admin-mobile/kate-admin-*.apk
```

### Signed release (internal track)

Set env (or `.env` — never commit):

```bash
ANDROID_KEYSTORE_BASE64=...      # base64 of .jks or .keystore
ANDROID_KEYSTORE_PASSWORD=...
ANDROID_KEY_ALIAS=...
ANDROID_KEY_PASSWORD=...         # optional if same as store password
ADMIN_ORIGIN=https://admin.yourdomain.com
npm run build:admin-apk:release
```

Generate base64 (local):

```bash
# macOS / Linux
base64 -i kate-admin-release.jks | tr -d '\n'
```

## GitHub Actions

Job **`build-admin-apk`** runs on push to `main` when `vars.ADMIN_ORIGIN` is set (after admin Worker deploy).

| Input                     | Type     | Required                               |
| ------------------------- | -------- | -------------------------------------- |
| `ADMIN_ORIGIN`            | variable | Yes — APK loads this URL               |
| `KATE_RELEASE_VERSION`    | variable | Optional — overrides `versionName`     |
| `BUILD_ADMIN_APK_RELEASE` | variable | Set `true` for signed release artifact |
| `ANDROID_KEYSTORE_*`      | secrets  | Required when release builds enabled   |

Download APK: **Actions** → workflow run → **Artifacts** → `kate-admin-apk-<run>`.

Retention: 90 days.

## Changelog

Record staff-facing APK notes in [`apps/admin-mobile/CHANGELOG.md`](../apps/admin-mobile/CHANGELOG.md) when bumping `versionName`.

## Distribution options

| Channel                   | C11                         | C12       |
| ------------------------- | --------------------------- | --------- |
| CI debug APK artifact     | ✅                          |           |
| Firebase App Distribution | Manual upload from artifact |           |
| Play Store closed track   |                             | C12 (AAB) |

## Related

- [ADMIN_MOBILE.md](ADMIN_MOBILE.md) — Capacitor shell + emulator dev
- [ADMIN_MOBILE_QA.md](ADMIN_MOBILE_QA.md) — route parity before shipping
- [DEPLOY_ADMIN.md](DEPLOY_ADMIN.md) — admin Worker must be live first
