#!/usr/bin/env node
/**
 * Decode ANDROID_KEYSTORE_BASE64 to a temp keystore for signed release builds (C11).
 * No-op when secrets are not configured (debug CI builds).
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "apps", "admin-mobile", ".build");
const keystorePath = join(outDir, "release.keystore");

export function prepareAndroidSigning(env = process.env) {
  const encoded = env.ANDROID_KEYSTORE_BASE64?.trim();
  const password = env.ANDROID_KEYSTORE_PASSWORD?.trim();
  const alias = env.ANDROID_KEY_ALIAS?.trim();

  if (!encoded || !password || !alias) {
    return { ready: false, keystorePath: null };
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(keystorePath, Buffer.from(encoded, "base64"));

  if (!existsSync(keystorePath)) {
    throw new Error("Failed to write Android release keystore.");
  }

  process.env.ANDROID_KEYSTORE_PATH = keystorePath;
  return { ready: true, keystorePath };
}
