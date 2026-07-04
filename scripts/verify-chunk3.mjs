#!/usr/bin/env node
import { loadEnv } from "./load-env.mjs";

loadEnv();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL/key in .env");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function get(path) {
  const res = await fetch(`${url}${path}`, { headers });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

let failed = 0;
const pass = (m) => console.log(`OK: ${m}`);
const fail = (m, d = "") => {
  console.error(`FAIL: ${m}`);
  if (d) console.error(`     ${d.slice(0, 400)}`);
  failed++;
};

console.log("Chunk 3 schema verification\n");

const tables = [
  ["customers", "/rest/v1/customers?select=id&limit=1"],
  ["delivery_zones", "/rest/v1/delivery_zones?select=id,zone_number&limit=5"],
  ["delivery_zone_areas", "/rest/v1/delivery_zone_areas?select=id&limit=1"],
  ["delivery_rules", "/rest/v1/delivery_rules?select=id,currency&limit=1"],
  ["payments", "/rest/v1/payments?select=id&limit=1"],
  ["order_status_events", "/rest/v1/order_status_events?select=id&limit=1"],
  ["inventory_events", "/rest/v1/inventory_events?select=id&limit=1"],
  ["audit_logs", "/rest/v1/audit_logs?select=id&limit=1"],
  ["product_variants", "/rest/v1/product_variants?select=id&limit=1"],
  ["system_config", "/rest/v1/system_config?select=key&limit=1"],
];

for (const [name, path] of tables) {
  const r = await get(path);
  if (r.ok) pass(`table ${name}`);
  else fail(`table ${name}`, r.body);
}

const zones = await get("/rest/v1/delivery_zones?select=zone_number&order=zone_number");
if (zones.ok) {
  try {
    const rows = JSON.parse(zones.body);
    if (rows.length >= 4) pass(`delivery zones seeded (${rows.length})`);
    else fail("delivery zones seed", `expected 4+, got ${rows.length}`);
  } catch {
    fail("delivery zones parse", zones.body);
  }
} else fail("delivery_zones", zones.body);

const settings = await get("/rest/v1/settings?select=shop_name,currency,mtn_momo_merchant_code");
if (settings.ok && settings.body.includes("Kate shop")) pass("settings Kate shop defaults");
else fail("settings defaults", settings.body);

const products = await get("/rest/v1/products?select=available_stock,reserved_stock&limit=1");
if (products.ok && products.body.includes("available_stock")) pass("products inventory columns");
else fail("products inventory columns", products.body);

console.log("");
if (failed) {
  console.error(
    `${failed} check(s) failed. Apply supabase/migrations/20260604150000_chunk3_production_schema.sql`,
  );
  process.exit(1);
}
console.log("All Chunk 3 checks passed.");
