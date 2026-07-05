#!/usr/bin/env node
/**
 * Creates public admin-mobile-releases bucket if missing (requires service role).
 */
import { loadEnv } from "./load-env.mjs";

loadEnv();

const bucket = "admin-mobile-releases";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (Dashboard → API → service_role).",
  );
  process.exit(1);
}

const res = await fetch(`${url}/storage/v1/bucket`, {
  method: "POST",
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id: bucket,
    name: bucket,
    public: true,
  }),
});

const body = await res.text();
if (res.ok || body.includes("already exists")) {
  console.log(`OK: ${bucket} bucket ready`);
  process.exit(0);
}

console.error("FAIL:", res.status, body);
process.exit(1);
