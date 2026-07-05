#!/usr/bin/env node
/**
 * Build Kate Admin Android artifact — APK or AAB (C11 + C12).
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, chmodSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./load-env.mjs";
import { resolveAdminMobileServerUrl } from "./resolve-admin-mobile-url.mjs";
import { resolveAdminMobileVersion } from "./resolve-admin-mobile-version.mjs";
import { prepareAndroidSigning } from "./prepare-android-signing.mjs";

loadEnv();

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mobileRoot = join(root, "apps", "admin-mobile");
const androidDir = join(mobileRoot, "android");
const distDir = join(root, "dist", "admin-mobile");

const format = process.argv.includes("--aab") ? "aab" : "apk";
const variant =
  process.argv.includes("--release") ||
  (process.env.ADMIN_APK_VARIANT ?? "debug").toLowerCase() === "release"
    ? "release"
    : "debug";

const serverUrl = resolveAdminMobileServerUrl();
if (!process.env.ADMIN_ORIGIN?.trim() && !process.env.ADMIN_MOBILE_SERVER_URL?.trim()) {
  console.warn(
    "Warning: ADMIN_ORIGIN is not set — APK will load http://localhost:5174. Set ADMIN_ORIGIN for production.",
  );
}

const version = resolveAdminMobileVersion({
  ...process.env,
  ADMIN_APK_VARIANT: variant,
  ADMIN_ANDROID_FORMAT: format,
});

console.log(`Kate Admin Android build`);
console.log(`  Server URL: ${serverUrl}`);
console.log(`  Version:    ${version.versionName} (${version.versionCode})`);
console.log(`  Format:     ${format.toUpperCase()}`);
console.log(`  Variant:    ${variant}\n`);

run("node", ["scripts/apply-admin-mobile-version.mjs"]);

if (variant === "release") {
  const signing = prepareAndroidSigning();
  if (!signing.ready) {
    console.error(
      "Release build requires ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, and ANDROID_KEY_ALIAS.",
    );
    process.exit(1);
  }
}

const sync = run("node", ["scripts/android-admin.mjs", "sync"]);
if (sync.status !== 0) process.exit(sync.status ?? 1);

const gradleTask =
  format === "aab"
    ? variant === "release"
      ? "bundleRelease"
      : "bundleDebug"
    : variant === "release"
      ? "assembleRelease"
      : "assembleDebug";

const gradlew = join(androidDir, process.platform === "win32" ? "gradlew.bat" : "gradlew");
if (!existsSync(gradlew)) {
  console.error("Missing Gradle wrapper — run npm run android:admin:sync");
  process.exit(1);
}
if (process.platform !== "win32") {
  chmodSync(gradlew, 0o755);
}

const build = spawnSync(gradlew, [gradleTask], {
  cwd: androidDir,
  stdio: "inherit",
  shell: false,
  env: process.env,
});

if ((build.status ?? 1) !== 0) process.exit(build.status ?? 1);

const builtArtifact =
  format === "aab"
    ? join(
        androidDir,
        "app",
        "build",
        "outputs",
        "bundle",
        variant,
        variant === "release" ? "app-release.aab" : "app-debug.aab",
      )
    : join(
        androidDir,
        "app",
        "build",
        "outputs",
        "apk",
        variant,
        variant === "release" ? "app-release.apk" : "app-debug.apk",
      );

if (!existsSync(builtArtifact)) {
  console.error(`Expected ${format.toUpperCase()} at ${builtArtifact}`);
  process.exit(1);
}

mkdirSync(distDir, { recursive: true });
const destArtifact = join(distDir, version.artifactName);
copyFileSync(builtArtifact, destArtifact);

console.log(`\n${format.toUpperCase()} ready: ${destArtifact}`);
if (format === "apk") {
  console.log(`Install: adb install -r "${destArtifact}"`);
} else {
  console.log(`Play Store upload: see docs/ADMIN_PLAY_STORE.md`);
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  return { status: result.status ?? 1 };
}
