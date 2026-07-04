#!/usr/bin/env node
/**
 * Chunk 1 acceptance: Supabase connectivity + baseline schema checks.
 */
import { loadEnv } from "./load-env.mjs";

loadEnv();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("FAIL: Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function get(path) {
  const res = await fetch(`${url}${path}`, { headers });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

let failed = 0;

function pass(msg) {
  console.log(`OK: ${msg}`);
}
function fail(msg, detail = "") {
  console.error(`FAIL: ${msg}`);
  if (detail) console.error(`     ${detail.slice(0, 300)}`);
  failed++;
}

console.log(`Verifying ${url} ...\n`);

const settings = await get("/rest/v1/settings?select=id,shop_name");
if (settings.ok) pass("settings table readable");
else fail("settings table", settings.body);

const categories = await get("/rest/v1/categories?select=id");
if (categories.ok) {
  try {
    const rows = JSON.parse(categories.body);
    if (Array.isArray(rows) && rows.length >= 5) pass(`categories seeded (${rows.length} rows)`);
    else fail("categories", `expected >= 5 rows, got ${rows?.length ?? 0}`);
  } catch {
    fail("categories parse", categories.body);
  }
} else fail("categories table", categories.body);

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketHeaders = serviceKey
  ? { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  : headers;
const bucket = await fetch(`${url}/storage/v1/bucket/product-images`, {
  headers: bucketHeaders,
}).then(async (res) => ({ ok: res.ok, status: res.status, body: await res.text() }));
if (bucket.ok) pass("storage bucket product-images exists");
else if (serviceKey) {
  const list = await fetch(`${url}/storage/v1/object/list/product-images`, {
    method: "POST",
    headers: { ...bucketHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: "", limit: 1 }),
  });
  if (list.ok) pass("storage bucket product-images exists (list OK)");
  else fail("storage bucket product-images", bucket.body || (await list.text()));
} else {
  fail(
    "storage bucket product-images (add SUPABASE_SERVICE_ROLE_KEY to .env for verify, or check Dashboard)",
    bucket.body,
  );
}

const products = await get("/rest/v1/products?select=id&limit=1");
if (products.ok) pass("products table readable");
else fail("products table", products.body);

console.log("");
if (failed) {
  console.error(`${failed} check(s) failed. See docs/SUPABASE_SETUP.md`);
  process.exit(1);
}
console.log("All Chunk 1 Supabase checks passed.");
