#!/usr/bin/env node
/** Write wrangler `.dev.vars` for local Worker preview (gitignored). */
import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "./load-env.mjs";

export function writeDevVars(distDir) {
  loadEnv();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) return false;

  const target = path.join(distDir, ".dev.vars");
  fs.writeFileSync(target, `SUPABASE_SERVICE_ROLE_KEY=${secret}\n`, "utf8");
  return true;
}
