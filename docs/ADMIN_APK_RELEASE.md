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

**Routine deploys do not publish APKs.** Use the manual workflow:

**Actions → Release Kate Admin APK** (`release-admin-apk.yml`) — run when native shell changes.

| Input           | Purpose                                      |
| --------------- | -------------------------------------------- |
| `release_notes` | Shown in the in-app “Update available” dialog  |
| `version_name`  | Optional override of `release.json`          |
| `build_variant` | `release` (signed) or `debug`                |

The workflow builds the APK, uploads to Supabase Storage, and updates the release manifest. Staff get a shareable install link in **Settings → Mobile app**.

See [ADMIN_MOBILE_UPDATES.md](ADMIN_MOBILE_UPDATES.md) for the full owner/staff flow.

Legacy: `build-admin-apk` on every `main` push was removed — use the release workflow instead.

| Input                     | Type     | Required                               |
| ------------------------- | -------- | -------------------------------------- |
| `ADMIN_ORIGIN`            | variable | Yes — APK loads this URL               |
| `KATE_RELEASE_VERSION`    | variable | Optional — overrides `versionName`     |
| `ANDROID_KEYSTORE_*`      | secrets  | Required for `release` variant           |

Backup artifact: workflow run → **Artifacts** → `kate-admin-apk-release-<run>`.

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
