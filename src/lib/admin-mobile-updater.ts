import { registerPlugin } from "@capacitor/core";

export type KateApkUpdaterPlugin = {
  downloadAndInstall(options: { url: string }): Promise<void>;
};

export const KateApkUpdater = registerPlugin<KateApkUpdaterPlugin>("KateApkUpdater");

export const ADMIN_MOBILE_DISMISSED_UPDATE_KEY = "kate_admin_dismissed_update_code";

export function readDismissedUpdateCode(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(ADMIN_MOBILE_DISMISSED_UPDATE_KEY);
  const parsed = Number.parseInt(raw ?? "0", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function dismissUpdateForVersion(versionCode: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_MOBILE_DISMISSED_UPDATE_KEY, String(versionCode));
}

export async function installAdminMobileUpdate(apkUrl: string): Promise<void> {
  await KateApkUpdater.downloadAndInstall({ url: apkUrl });
}
