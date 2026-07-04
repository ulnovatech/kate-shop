#!/usr/bin/env node
/** Build and deploy the storefront Worker (C5). */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { loadEnv } from "./load-env.mjs";
import { putWorkerSecret } from "./put-worker-secret.mjs";
import { releaseDistLock } from "./release-dist-lock.mjs";

loadEnv();
releaseDistLock();

const root = process.cwd();
const distDir = path.join("apps", "storefront", "dist");

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("npm", ["run", "build:storefront"]);
run("node", ["scripts/prepare-deploy.mjs"], {
  KATE_DIST_DIR: distDir,
  KATE_WORKER_TARGET: "storefront",
});
if (putWorkerSecret({ distDir, name: "SUPABASE_SERVICE_ROLE_KEY", value: process.env.SUPABASE_SERVICE_ROLE_KEY })) {
  console.log("Uploaded Worker secret SUPABASE_SERVICE_ROLE_KEY.");
}
run("npx", ["nitro", "deploy", "--prebuilt", "--dir", distDir]);
