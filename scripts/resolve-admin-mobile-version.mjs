#!/usr/bin/env node
/**
 * Resolve Kate Admin APK version for Gradle + CI artifacts (C11).
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const releasePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "apps",
  "admin-mobile",
  "release.json",
);

const DEFAULTS = {
  versionName: "1.0.0",
  versionCodeBase: 1000,
  applicationId: "com.kate.admin",
  artifactPrefix: "kate-admin",
};

function readReleaseFile() {
  if (!existsSync(releasePath)) return { ...DEFAULTS };
  return { ...DEFAULTS, ...JSON.parse(readFileSync(releasePath, "utf8")) };
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
export function resolveAdminMobileVersion(env = process.env) {
  const file = readReleaseFile();
  const versionName = env.KATE_RELEASE_VERSION?.trim() || file.versionName;
  const build = Number.parseInt(env.KATE_ANDROID_VERSION_BUILD ?? "0", 10);
  const buildOffset = Number.isFinite(build) && build >= 0 ? build : 0;
  const versionCode = file.versionCodeBase + buildOffset;
  const variant = (env.ADMIN_APK_VARIANT ?? "debug").toLowerCase() === "release" ? "release" : "debug";
  const format =
    env.ADMIN_ANDROID_FORMAT === "aab" || env.ADMIN_ANDROID_FORMAT === "apk"
      ? env.ADMIN_ANDROID_FORMAT
      : "apk";
  const artifactPrefix = file.artifactPrefix || DEFAULTS.artifactPrefix;
  const extension = format === "aab" ? "aab" : "apk";
  const artifactName = `${artifactPrefix}-${versionName}-${versionCode}-${variant}.${extension}`;

  return {
    versionName,
    versionCode,
    versionCodeBase: file.versionCodeBase,
    applicationId: file.applicationId,
    artifactPrefix,
    variant,
    format,
    extension,
    artifactName,
  };
}
