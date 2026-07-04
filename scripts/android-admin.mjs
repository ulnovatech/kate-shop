#!/usr/bin/env node
/**
 * Kate Admin Capacitor Android — sync, run, open, or build debug APK (C7).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./load-env.mjs";
import { EMULATOR_HINT, resolveAdminMobileServerUrl } from "./resolve-admin-mobile-url.mjs";

loadEnv();

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mobileRoot = join(root, "apps", "admin-mobile");
const androidDir = join(mobileRoot, "android");

const USAGE = `Usage: node scripts/android-admin.mjs <command>

Commands:
  sync   Capacitor sync (writes server URL into native project)
  run    Install and launch on device/emulator (default)
  open   Open Android Studio
  build  assembleDebug APK (requires Android SDK)

Env (first match wins):
  ADMIN_MOBILE_SERVER_URL   e.g. ${EMULATOR_HINT} for emulator + npm run dev:admin
  VITE_ADMIN_ORIGIN / ADMIN_ORIGIN   production or local admin URL
`;

const cmd = process.argv[2] ?? "run";
const capCommands = new Set(["sync", "run", "open"]);

if (cmd === "help" || cmd === "--help" || cmd === "-h") {
  console.log(USAGE.trim());
  process.exit(0);
}

if (!capCommands.has(cmd) && cmd !== "build") {
  console.error(USAGE);
  process.exit(1);
}

const serverUrl = resolveAdminMobileServerUrl();
console.log(`Kate Admin mobile — loading ${serverUrl}\n`);

if (!existsSync(androidDir)) {
  console.log("Android project not found — running cap add android…\n");
  const add = runCap(["add", "android"]);
  if ((add.status ?? 1) !== 0) process.exit(add.status ?? 1);
}

if (cmd === "build") {
  const gradlew = join(androidDir, process.platform === "win32" ? "gradlew.bat" : "gradlew");
  if (!existsSync(gradlew)) {
    console.error("Missing Gradle wrapper — run: npm run android:admin:sync");
    process.exit(1);
  }
  const build = spawnSync(gradlew, ["assembleDebug"], {
    cwd: androidDir,
    stdio: "inherit",
    shell: true,
  });
  if ((build.status ?? 1) === 0) {
    console.log("\nAPK: apps/admin-mobile/android/app/build/outputs/apk/debug/app-debug.apk");
  }
  process.exit(build.status ?? 1);
}

if (cmd !== "sync" && !existsSync(androidDir)) {
  console.error("Android project missing after cap add.");
  process.exit(1);
}

if (cmd === "run" || cmd === "sync") {
  const sync = runCap(["sync", "android"]);
  if ((sync.status ?? 1) !== 0) process.exit(sync.status ?? 1);
  if (cmd === "sync") process.exit(0);
}

const run = runCap(["run", "android"]);
process.exit(run.status ?? 1);

function runCap(args) {
  return spawnSync("npx", ["cap", ...args], {
    cwd: mobileRoot,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
}
