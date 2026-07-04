#!/usr/bin/env node
/**
 * Verify monolith admin routes, apps/admin sync map, and C10 catalog stay aligned.
 * Run: npm run verify:admin-routes
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ADMIN_ROUTE_CATALOG } from "@kate/domain/admin-route-catalog";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routesDir = path.join(root, "src", "routes");
const staffDir = path.join(root, "apps", "admin", "src", "routes", "_staff");

/** Extra C8 route — not counted in the 20-route parity matrix */
const EXTRA_STANDALONE = ["login-callback.tsx"];

let failed = false;

function fail(message) {
  console.error(`✗ ${message}`);
  failed = true;
}

function ok(message) {
  console.log(`✓ ${message}`);
}

for (const entry of ADMIN_ROUTE_CATALOG) {
  const monoPath = path.join(routesDir, entry.monolithFile);
  if (!fs.existsSync(monoPath)) {
    fail(`Missing monolith route: src/routes/${entry.monolithFile} (${entry.id})`);
    continue;
  }

  const standalonePath = path.join(staffDir, entry.standaloneRel);
  if (!fs.existsSync(standalonePath)) {
    fail(`Missing standalone route: apps/admin/.../_staff/${entry.standaloneRel} (${entry.id})`);
    continue;
  }

  const monoText = fs.readFileSync(monoPath, "utf8");
  if (!monoText.includes(entry.heading)) {
    fail(`Heading "${entry.heading}" not found in ${entry.monolithFile} — update catalog or page`);
  }

  if (entry.permission && !monoText.includes(`adminPermission: "${entry.permission}"`)) {
    fail(`Permission "${entry.permission}" missing in ${entry.monolithFile}`);
  }

  if (entry.public && !monoText.includes("createFileRoute")) {
    fail(`Public route ${entry.monolithFile} should export createFileRoute`);
  }
}

for (const extra of EXTRA_STANDALONE) {
  const p = path.join(staffDir, extra);
  if (!fs.existsSync(p)) fail(`Missing extra standalone route: ${extra}`);
  else ok(`Extra route present: ${extra}`);
}

const syncScript = fs.readFileSync(
  path.join(root, "scripts", "sync-admin-app-routes.mjs"),
  "utf8",
);

for (const entry of ADMIN_ROUTE_CATALOG) {
  if (!syncScript.includes(`["${entry.monolithFile}"`)) {
    fail(`sync-admin-app-routes.mjs missing map for ${entry.monolithFile}`);
  }
}

if (failed) {
  console.error("\nAdmin route parity check failed. See docs/ADMIN_MOBILE_QA.md");
  process.exit(1);
}

console.log(`\nKate Admin route parity OK — ${ADMIN_ROUTE_CATALOG.length} routes aligned.`);
process.exit(0);
