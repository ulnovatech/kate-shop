# Kate Admin — Play Store (C12, future-ready)

Google Play distribution is **not automated yet**. This chunk adds the **AAB build pipeline**, listing templates, and upload stub so you can ship when ready.

## What is ready now

| Piece | Status |
|-------|--------|
| Release AAB build | `npm run build:admin-aab:release` |
| CI AAB artifact | Optional via `BUILD_ADMIN_AAB=true` |
| Listing copy draft | [`apps/admin-mobile/play-store/listing.md`](../apps/admin-mobile/play-store/listing.md) |
| Upload script stub | `npm run upload:play-store` (validates AAB, prints checklist) |
| Firebase scaffold | [`google-services.json.example`](../apps/admin-mobile/android/app/google-services.json.example) |

## Build AAB locally

Signed release (same keystore as C11 APK):

```bash
ADMIN_ORIGIN=https://admin.yourdomain.com npm run build:admin-aab:release
```

Output: `dist/admin-mobile/kate-admin-<version>-<code>-release.aab`

Debug bundle (internal testing without signing requirements beyond debug key):

```bash
npm run build:admin-aab
```

## Firebase (required for push + Play)

1. Create a Firebase project linked to package `com.kate.admin`
2. Download `google-services.json` → `apps/admin-mobile/android/app/google-services.json` (gitignored)
3. Copy server key to `FCM_SERVER_KEY` — see [ADMIN_STAFF_PUSH.md](ADMIN_STAFF_PUSH.md)
4. Re-run `npm run android:admin:sync`

Gradle applies the Google Services plugin automatically when the file is present.

## Play Console checklist (when you ship)

1. Create app with package `com.kate.admin`
2. Upload release AAB from `dist/admin-mobile/`
3. Paste listing from `play-store/listing.md` (adjust URLs and support email)
4. Complete Data safety, content rating, and target API level
5. Use **internal testing** track first; promote to production after QA

## CI

On `main`, when `vars.ADMIN_ORIGIN` is set:

- **Always:** debug APK (C11)
- **`BUILD_ADMIN_APK_RELEASE=true`:** signed release APK
- **`BUILD_ADMIN_AAB=true`:** signed release AAB (C12)

Artifacts are retained 90 days — download from the Actions run.

## Upload automation (later)

`scripts/upload-play-store.mjs` is a stub. To automate:

- Add Play Developer API service account
- Store JSON key as GitHub secret `PLAY_SERVICE_ACCOUNT_JSON`
- Replace stub with `bundletool` / `googleapis` upload step

Do **not** enable upload in CI until internal testing is complete.

## Related

- [ADMIN_APK_RELEASE.md](ADMIN_APK_RELEASE.md) — versioning and keystore
- [ADMIN_STAFF_PUSH.md](ADMIN_STAFF_PUSH.md) — FCM for order alerts
- [ADMIN_MOBILE.md](ADMIN_MOBILE.md) — Capacitor shell
