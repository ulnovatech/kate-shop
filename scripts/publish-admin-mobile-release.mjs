#!/usr/bin/env node
/**
 * Upload Kate Admin APK to Supabase Storage and publish release manifest.
 * Used by the manual "Release Kate Admin APK" GitHub workflow — not on every deploy.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./load-env.mjs";
import { resolveAdminMobileVersion } from "./resolve-admin-mobile-version.mjs";

loadEnv();

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist", "admin-mobile");
const bucket = "admin-mobile-releases";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const releaseNotes = process.env.ADMIN_MOBILE_RELEASE_NOTES?.trim() || "Kate Admin update";

if (!url || !serviceKey) {
  console.error("Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const version = resolveAdminMobileVersion(process.env);

let artifactPath = join(distDir, version.artifactName);
if (!existsSync(artifactPath)) {
  const candidates = readdirSync(distDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".apk"))
    .map((entry) => entry.name);
  if (!candidates.length) {
    console.error(`No APK found in ${distDir}. Run npm run build:admin-apk first.`);
    process.exit(1);
  }
  artifactPath = join(distDir, candidates.sort().at(-1));
}

const apkBytes = readFileSync(artifactPath);
const sha256 = createHash("sha256").update(apkBytes).digest("hex");
const storagePath = `releases/${version.artifactName}`;

console.log(`Publishing ${version.versionName} (${version.versionCode})`);
console.log(`  Artifact: ${artifactPath}`);
console.log(`  Storage:  ${bucket}/${storagePath}`);

const uploadRes = await fetch(
  `${url}/storage/v1/object/${bucket}/${encodeURIComponent(storagePath).replace(/%2F/g, "/")}`,
  {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/vnd.android.package-archive",
      "x-upsert": "true",
    },
    body: apkBytes,
  },
);

if (!uploadRes.ok) {
  const body = await uploadRes.text();
  console.error("Upload failed:", uploadRes.status, body);
  process.exit(1);
}

const apkUrl = `${url}/storage/v1/object/public/${bucket}/${storagePath}`;
const publishedAt = new Date().toISOString();

const manifest = {
  versionName: version.versionName,
  versionCode: version.versionCode,
  apkUrl,
  sha256,
  releaseNotes,
  publishedAt,
  applicationId: version.applicationId,
};

const upsertRes = await fetch(`${url}/rest/v1/system_config?on_conflict=key`, {
  method: "POST",
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates",
  },
  body: JSON.stringify({
    key: "admin_mobile_android_release",
    value: manifest,
    updated_at: publishedAt,
  }),
});

if (!upsertRes.ok) {
  const body = await upsertRes.text();
  console.error("Manifest update failed:", upsertRes.status, body);
  process.exit(1);
}

console.log("\nRelease published.");
console.log(`  Install URL: ${apkUrl}`);
console.log(`  SHA-256:     ${sha256}`);
console.log("\nInstalled apps will show an update prompt on next launch.");
