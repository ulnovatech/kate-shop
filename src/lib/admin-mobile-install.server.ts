import { readAdminMobileAndroidRelease } from "@kate/api/admin-mobile-release.server";

const INSTALL_PATHS = new Set(["/install", "/admin/install"]);

export function isAdminMobileInstallPath(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  return INSTALL_PATHS.has(path);
}

function noReleaseHtmlResponse(): Response {
  return new Response(
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kate Admin install</title></head><body style="font-family:system-ui,sans-serif;max-width:28rem;margin:2rem auto;padding:0 1rem;color:#111"><h1 style="font-size:1.25rem">No APK published yet</h1><p>Ask your shop owner to publish Kate Admin from <strong>Settings → Mobile app</strong>.</p></body></html>',
    {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    },
  );
}

function installErrorHtmlResponse(message: string): Response {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kate Admin install</title></head><body style="font-family:system-ui,sans-serif;max-width:28rem;margin:2rem auto;padding:0 1rem;color:#111"><h1 style="font-size:1.25rem">Install link unavailable</h1><p>${message}</p></body></html>`,
    {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    },
  );
}

/** Strip whitespace/control chars that break the Location response header. */
export function sanitizeAdminMobileInstallRedirectUrl(raw: string): string {
  const cleaned = raw.trim().replace(/[\r\n\t\0]/g, "");
  return new URL(cleaned).href;
}

export async function adminMobileInstallResponse(): Promise<Response> {
  let release;
  try {
    release = await readAdminMobileAndroidRelease();
  } catch {
    return installErrorHtmlResponse(
      "Could not load the published release. Try again in a moment or ask your shop owner to republish.",
    );
  }

  if (!release?.apkUrl) {
    return noReleaseHtmlResponse();
  }

  try {
    const target = sanitizeAdminMobileInstallRedirectUrl(release.apkUrl);
    return Response.redirect(target, 302);
  } catch {
    return installErrorHtmlResponse(
      "The published install URL is invalid. Ask your shop owner to publish a new release from Settings → Mobile app.",
    );
  }
}
