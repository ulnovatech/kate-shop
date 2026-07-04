#!/usr/bin/env node
/**
 * Applies Chunk 3 migration using Supabase database password (direct Postgres).
 * Set DATABASE_URL in .env — Session pooler URI from Dashboard → Database → Connect.
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const file = resolve("supabase/migrations/20260604150000_chunk3_production_schema.sql");
const result = spawnSync(process.execPath, [resolve("scripts/apply-sql-file.mjs"), file], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
