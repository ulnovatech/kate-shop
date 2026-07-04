#!/usr/bin/env node
/**
 * Future Play Console upload stub (C12) — prints checklist; does not upload yet.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAdminMobileVersion } from "./resolve-admin-mobile-version.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist", "admin-mobile");
const version = resolveAdminMobileVersion({
  ...process.env,
  ADMIN_APK_VARIANT: "release",
  ADMIN_ANDROID_FORMAT: "aab",
});

const aabPath = join(distDir, version.artifactName);

console.log("Kate Admin — Play Store upload (stub)\n");
console.log("Distribution to Google Play is not automated yet.");
console.log("When ready, upload manually or wire the Play Developer API.\n");
console.log("Checklist:");
console.log("  1. Build signed release AAB: npm run build:admin-aab:release");
console.log("  2. Confirm artifact exists:", aabPath);
console.log("  3. Review listing copy: apps/admin-mobile/play-store/listing.md");
console.log("  4. Upload in Play Console → Production / Internal testing");
console.log("  5. Complete Data safety + app content declarations\n");

if (!existsSync(aabPath)) {
  console.warn(`AAB not found at ${aabPath} — run build:admin-aab:release first.`);
  process.exit(1);
}

console.log("AAB found. Ready for manual Play Console upload.");
