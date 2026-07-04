#!/usr/bin/env node
/** Write android/version.properties before Gradle build (C11). */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAdminMobileVersion } from "./resolve-admin-mobile-version.mjs";

const androidDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "apps",
  "admin-mobile",
  "android",
);

const version = resolveAdminMobileVersion();
const lines = [
  `VERSION_CODE=${version.versionCode}`,
  `VERSION_NAME=${version.versionName}`,
  "",
];
const path = join(androidDir, "version.properties");
writeFileSync(path, lines.join("\n"));
console.log(`Applied Android version ${version.versionName} (${version.versionCode}) → ${path}`);
