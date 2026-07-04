#!/usr/bin/env node
/** Preview the storefront Worker locally (C5). */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { writeDevVars } from "./write-dev-vars.mjs";

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

run("node", ["scripts/prepare-deploy.mjs"], { KATE_DIST_DIR: distDir });
if (writeDevVars(distDir)) {
  console.log("Wrote .dev.vars for local service-role SSR.");
}
run("npx", ["wrangler", "--cwd", distDir, "dev"]);
