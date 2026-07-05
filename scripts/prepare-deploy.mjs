/**
 * Chunk 17 / C6 — patch Nitro-generated wrangler.json before deploy.
 * Injects worker name, runtime vars, observability, and optional custom-domain routes.
 */
import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const distRoot = process.env.KATE_DIST_DIR?.trim() || "dist";
const wranglerPath = path.join(distRoot, "server", "wrangler.json");
if (!fs.existsSync(wranglerPath)) {
  console.error(
    `Missing ${wranglerPath} — run a production build first (nitro: true in vite.config.ts).`,
  );
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(wranglerPath, "utf8"));

const target =
  process.env.KATE_WORKER_TARGET?.trim() ||
  (distRoot.replace(/\\/g, "/").includes("/apps/admin/") ? "admin" : "storefront");

cfg.name =
  target === "admin"
    ? process.env.CLOUDFLARE_ADMIN_WORKER_NAME?.trim() || "kate-admin"
    : process.env.CLOUDFLARE_WORKER_NAME?.trim() || "kate-shop";

if (cfg.assets?.directory) {
  cfg.assets.directory = cfg.assets.directory.replace(/\\/g, "/");
}

// Nitro stamps today's date on each build; cap so local wrangler dev stays compatible.
cfg.compatibility_date = process.env.CLOUDFLARE_COMPATIBILITY_DATE?.trim() || "2026-06-10";

const vars = {};
for (const key of [
  "NODE_ENV",
  "APP_ORIGIN",
  "ADMIN_ORIGIN",
  "VITE_ADMIN_ORIGIN",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_PROJECT_ID",
  "BOOTSTRAP_TOKEN",
  "GITHUB_REPO",
]) {
  const value = process.env[key]?.trim();
  if (value) vars[key] = value;
}

if (Object.keys(vars).length) {
  cfg.vars = { ...(cfg.vars ?? {}), ...vars };
}

const zoneName = process.env.CLOUDFLARE_ZONE_NAME?.trim();
const originUrl =
  target === "admin" ? process.env.ADMIN_ORIGIN?.trim() : process.env.APP_ORIGIN?.trim();

if (zoneName && originUrl) {
  try {
    const hostname = new URL(originUrl).hostname;
    cfg.routes = [{ pattern: `${hostname}/*`, zone_name: zoneName }];
  } catch {
    console.warn(`Could not parse origin URL for routes: ${originUrl}`);
  }
}

if (process.env.CLOUDFLARE_WORKER_LOGS !== "false") {
  cfg.observability = {
    enabled: true,
    head_sampling_rate: 1,
    logs: {
      enabled: true,
      head_sampling_rate: 1,
      persist: true,
      invocation_logs: true,
    },
    traces: {
      enabled: false,
      persist: true,
      head_sampling_rate: 1,
    },
  };
}

fs.writeFileSync(wranglerPath, `${JSON.stringify(cfg, null, 2)}\n`);

// Nitro also writes dist/.wrangler/deploy/config.json. Wrangler 4.x errors when both
// that redirect config and server/wrangler.json exist with different base paths.
const nitroWranglerDir = path.join(distRoot, ".wrangler");
if (fs.existsSync(nitroWranglerDir)) {
  fs.rmSync(nitroWranglerDir, { recursive: true, force: true });
  console.log(`Removed ${nitroWranglerDir} to avoid wrangler deploy config conflict.`);
}

console.log(`Prepared wrangler deploy config for worker "${cfg.name}" (${target}).`);
