#!/usr/bin/env node
/**
 * Upload staff email OTP secrets to the deployed kate-admin Worker
 * without a full redeploy (safe when local .env has localhost origins).
 */
import { spawnSync } from "node:child_process";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const workerName = process.env.CLOUDFLARE_ADMIN_WORKER_NAME?.trim() || "kate-admin";

function putSecret(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.warn(`Skip ${name} — not set in .env`);
    return false;
  }

  const result = spawnSync("npx", ["wrangler", "secret", "put", name, "--name", workerName], {
    stdio: ["pipe", "inherit", "inherit"],
    shell: true,
    env: process.env,
    input: `${value}\n`,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log(`Uploaded secret ${name} to worker "${workerName}".`);
  return true;
}

if (!process.env.CLOUDFLARE_API_TOKEN?.trim()) {
  console.error("Missing CLOUDFLARE_API_TOKEN in .env");
  process.exit(1);
}

console.log(`Syncing staff email OTP secrets to Cloudflare worker "${workerName}"…\n`);

// Secrets are available as process.env at runtime (same as wrangler vars).
putSecret("EMAIL_OTP_PROVIDER");
putSecret("GMAIL_USER");
putSecret("GMAIL_APP_PASSWORD");

console.log("\nDone. Redeploy admin Worker when you change non-secret config.");
