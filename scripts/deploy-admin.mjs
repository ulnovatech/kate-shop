#!/usr/bin/env node
/** Build and deploy the Kate Admin Worker (C6). */
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const distDir = path.join("apps", "admin", "dist");

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(
      `Missing ${name}. Set ADMIN_ORIGIN (and VITE_ADMIN_ORIGIN) before deploying admin. See docs/DEPLOY_ADMIN.md`,
    );
    process.exit(1);
  }
  return value;
}

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const adminOrigin = requireEnv("ADMIN_ORIGIN");
const appOrigin = process.env.APP_ORIGIN?.trim() || process.env.VITE_APP_ORIGIN?.trim();

const buildEnv = {
  VITE_ADMIN_ORIGIN: process.env.VITE_ADMIN_ORIGIN?.trim() || adminOrigin,
  ...(appOrigin ? { VITE_APP_ORIGIN: appOrigin, APP_ORIGIN: appOrigin } : {}),
};

run("npm", ["run", "build:admin"], buildEnv);
run("node", ["scripts/prepare-deploy.mjs"], {
  KATE_DIST_DIR: distDir,
  KATE_WORKER_TARGET: "admin",
  ADMIN_ORIGIN: adminOrigin,
  VITE_ADMIN_ORIGIN: buildEnv.VITE_ADMIN_ORIGIN,
});
run("npx", ["nitro", "deploy", "--prebuilt", "--dir", distDir]);
