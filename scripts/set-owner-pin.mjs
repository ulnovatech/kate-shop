#!/usr/bin/env node
/**
 * One-time ops: set the shop owner's staff PIN from STAFF_OWNER_INITIAL_PIN in .env.
 * Never commit the PIN value to the repository.
 */
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const OWNER_ROLE_ID = "a9000001-0001-4001-a001-000000000001";
const PIN_PATTERN = /^\d{5}$/;

const pin = process.env.STAFF_OWNER_INITIAL_PIN?.trim();
if (!pin || !PIN_PATTERN.test(pin)) {
  console.error("Set STAFF_OWNER_INITIAL_PIN to a 5-digit value in .env, then rerun.");
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: ownerRow, error: ownerErr } = await supabase
  .from("staff_role_assignments")
  .select("user_id")
  .eq("role_id", OWNER_ROLE_ID)
  .order("assigned_at", { ascending: true })
  .limit(1)
  .maybeSingle();

if (ownerErr) {
  console.error("Could not resolve owner:", ownerErr.message);
  process.exit(1);
}

if (!ownerRow?.user_id) {
  console.error("No owner account found in staff_role_assignments.");
  process.exit(1);
}

const pinHash = await bcrypt.hash(pin, 10);
const now = new Date().toISOString();

const { error: upsertErr } = await supabase.from("staff_pin_credentials").upsert(
  {
    user_id: ownerRow.user_id,
    pin_hash: pinHash,
    failed_attempts: 0,
    locked_until: null,
    updated_at: now,
  },
  { onConflict: "user_id" },
);

if (upsertErr) {
  console.error("Could not store PIN:", upsertErr.message);
  process.exit(1);
}

console.log(`OK: owner PIN updated for user ${ownerRow.user_id}`);
