#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-sql-file.mjs <path-to.sql>");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Set DATABASE_URL in .env (Supabase → Database → Connection string → URI).");
  process.exit(1);
}

const sql = readFileSync(resolve(file), "utf8");
const pg = await import("pg");
const client = new pg.default.Client({ connectionString: databaseUrl });
await client.connect();
try {
  await client.query(sql);
  console.log(`OK: applied ${file}`);
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
