#!/usr/bin/env node
/** Upload Worker secrets after prepare-deploy (matches GitHub wrangler-action secrets block). */
import { spawnSync } from "node:child_process";
import path from "node:path";

export function putWorkerSecret({ distDir, name, value, cwd = process.cwd() }) {
  const secret = value?.trim();
  if (!secret) return false;

  const config = path.join(distDir, "server", "wrangler.json");
  const result = spawnSync("npx", ["wrangler", "secret", "put", name, "--config", config], {
    cwd,
    stdio: ["pipe", "inherit", "inherit"],
    shell: true,
    env: process.env,
    input: `${secret}\n`,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return true;
}
