#!/usr/bin/env node
/** Write wrangler `.dev.vars` for local Worker preview (gitignored). */
import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "./load-env.mjs";

function appendDevVar(lines, key, value) {
  const trimmed = value?.trim();
  if (!trimmed) return;
  lines.push(`${key}=${trimmed}`);
}

export function writeDevVars(distDir, { admin = false } = {}) {
  loadEnv();
  const lines = [];

  appendDevVar(lines, "SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (admin) {
    appendDevVar(lines, "EMAIL_OTP_PROVIDER", process.env.EMAIL_OTP_PROVIDER);
    appendDevVar(lines, "GMAIL_USER", process.env.GMAIL_USER);
    appendDevVar(lines, "GMAIL_APP_PASSWORD", process.env.GMAIL_APP_PASSWORD);
    appendDevVar(lines, "KATE_GH_RELEASE_TOKEN", process.env.KATE_GH_RELEASE_TOKEN);
  }

  if (!lines.length) return false;

  const target = path.join(distDir, ".dev.vars");
  fs.writeFileSync(target, `${lines.join("\n")}\n`, "utf8");
  return true;
}
