/** Published Kate Admin Android release manifest (stored in system_config). */
export const ADMIN_MOBILE_RELEASE_CONFIG_KEY = "admin_mobile_android_release";

export const ADMIN_MOBILE_RELEASE_BUCKET = "admin-mobile-releases";

export type AdminMobileAndroidRelease = {
  versionName: string;
  versionCode: number;
  apkUrl: string;
  sha256: string;
  releaseNotes: string;
  publishedAt: string;
  applicationId: string;
};

export function isNewerAdminMobileRelease(
  installedVersionCode: number,
  release: AdminMobileAndroidRelease,
): boolean {
  return release.versionCode > installedVersionCode;
}

export function parseAdminMobileRelease(value: unknown): AdminMobileAndroidRelease | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const versionName = typeof row.versionName === "string" ? row.versionName.trim() : "";
  const versionCode =
    typeof row.versionCode === "number"
      ? row.versionCode
      : Number.parseInt(String(row.versionCode ?? ""), 10);
  const apkUrl = typeof row.apkUrl === "string" ? row.apkUrl.trim().replace(/[\r\n\t\0]/g, "") : "";
  const sha256 = typeof row.sha256 === "string" ? row.sha256.trim() : "";
  const releaseNotes = typeof row.releaseNotes === "string" ? row.releaseNotes : "";
  const publishedAt = typeof row.publishedAt === "string" ? row.publishedAt : "";
  const applicationId =
    typeof row.applicationId === "string" ? row.applicationId.trim() : "com.kate.admin";

  if (!versionName || !Number.isFinite(versionCode) || versionCode < 1 || !apkUrl || !publishedAt) {
    return null;
  }

  return {
    versionName,
    versionCode,
    apkUrl,
    sha256,
    releaseNotes,
    publishedAt,
    applicationId,
  };
}
