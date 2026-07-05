import { readAdminMobileAndroidRelease } from "@kate/api/admin-mobile-release.server";

const INSTALL_PATHS = new Set(["/install", "/admin/install"]);

export function isAdminMobileInstallPath(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  return INSTALL_PATHS.has(path);
}

export async function adminMobileInstallResponse(): Promise<Response> {
  const release = await readAdminMobileAndroidRelease();
  if (!release?.apkUrl) {
    return new Response(
      '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kate Admin install</title></head><body style="font-family:system-ui,sans-serif;max-width:28rem;margin:2rem auto;padding:0 1rem;color:#111"><h1 style="font-size:1.25rem">No APK published yet</h1><p>Ask your shop owner to publish Kate Admin from <strong>Settings → Mobile app</strong>.</p></body></html>',
      {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
      },
    );
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: release.apkUrl,
      "cache-control": "no-store",
    },
  });
}
