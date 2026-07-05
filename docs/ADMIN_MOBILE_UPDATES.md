# Kate Admin — mobile updates & distribution

Staff use a **Capacitor APK** that loads the live admin web app. Two update paths:

| Change type                               | How staff get it                                 |
| ----------------------------------------- | ------------------------------------------------ |
| Admin web (UI, API, auth)                 | Automatic on next open — no APK release          |
| Native shell (plugins, icons, deep links) | **Published APK release** + in-app update prompt |

Routine pushes to `main` deploy the admin Worker only. They do **not** publish a new APK.

## Publish from admin (owner) — one button

**Settings → Mobile app → Publish update to staff**

1. Version is suggested automatically (patch bump from last release).
2. Write a short note for staff (shown in the update dialog).
3. Click **Publish update to staff**.
4. Wait on the same page — progress updates every few seconds.
5. When done, staff devices see **Update available** on next open.

No GitHub UI, no terminal, no `release.json` edit required (version is passed to CI).

### One-time setup

Add to GitHub **production** environment:

| Secret                  | Purpose                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| `KATE_GH_RELEASE_TOKEN` | Fine-grained PAT with **Actions: Read and write** on `ulnovatech/kate-shop` |
| `ANDROID_KEYSTORE_*`    | Required for **Release** builds (staff devices)                             |

Redeploy admin after adding `KATE_GH_RELEASE_TOKEN` (push to `main`).

Optional variable `GITHUB_REPO` (defaults to `ulnovatech/kate-shop`).

## First install (share link)

After publishing:

1. **Settings → Mobile app** → **Copy install link** (short `…/install` URL — safe to paste in WhatsApp)
2. Send to new staff (WhatsApp, email)

## In-app update (staff)

1. App checks the published manifest on launch
2. **Update available** → **Update now** → Android install confirm
3. **Later** snoozes until a newer release

## Related

- [ADMIN_MOBILE.md](ADMIN_MOBILE.md)
- [ADMIN_APK_RELEASE.md](ADMIN_APK_RELEASE.md)
