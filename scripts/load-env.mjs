import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** Load .env into process.env (no dependency). No-op on Cloudflare Workers (no filesystem / import.meta.url). */
export function loadEnv() {
  let metaUrl;
  try {
    metaUrl = import.meta.url;
  } catch {
    return;
  }
  if (!metaUrl) return;

  const root = resolve(dirname(fileURLToPath(metaUrl)), "..");
  const path = resolve(root, ".env");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
