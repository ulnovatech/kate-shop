#!/usr/bin/env node
/**
 * Apply supabase/migrations/*.sql in order via DATABASE_URL (direct Postgres).
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Set DATABASE_URL in .env (Supabase → Database → Connection string → URI).");
  process.exit(1);
}

const migrationsDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "supabase",
  "migrations",
);
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let pg;
try {
  pg = await import("pg");
} catch {
  console.error("Install pg: npm install --save-dev pg");
  process.exit(1);
}

const client = new pg.default.Client({ connectionString: databaseUrl });
await client.connect();

for (const file of files) {
  const sql = readFileSync(resolve(migrationsDir, file), "utf8");
  console.log(`Applying ${file} ...`);
  try {
    await client.query(sql);
    console.log(`  OK`);
  } catch (err) {
    console.error(`  Error in ${file}:`, err.message);
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log("Migrations applied.");
