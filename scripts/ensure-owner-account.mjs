#!/usr/bin/env node
/**
 * Assign the locked Owner role to a staff account by email.
 * Idempotent — safe to rerun after migrations or invite mistakes.
 *
 * Usage:
 *   node scripts/ensure-owner-account.mjs ulnovatech@gmail.com
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const OWNER_ROLE_ID = "a9000001-0001-4001-a001-000000000001";
const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: node scripts/ensure-owner-account.mjs <owner-email>");
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

const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 500,
});

if (listErr) {
  console.error("Could not list users:", listErr.message);
  process.exit(1);
}

const user = list.users.find((u) => (u.email ?? "").toLowerCase() === email);
if (!user) {
  console.error(`No auth user found for ${email}. Sign up at /admin/setup or /admin/login first.`);
  process.exit(1);
}

const { error: assignErr } = await supabase.from("staff_role_assignments").upsert(
  {
    user_id: user.id,
    role_id: OWNER_ROLE_ID,
    assigned_at: new Date().toISOString(),
    assigned_by: user.id,
  },
  { onConflict: "user_id" },
);

if (assignErr) {
  console.error("Could not assign owner role:", assignErr.message);
  process.exit(1);
}

const { error: legacyDeleteErr } = await supabase
  .from("user_roles")
  .delete()
  .eq("user_id", user.id);

if (legacyDeleteErr) {
  console.error("Could not clear legacy user_roles:", legacyDeleteErr.message);
  process.exit(1);
}

const { error: legacyErr } = await supabase.from("user_roles").insert({
  user_id: user.id,
  role: "owner",
});

if (legacyErr) {
  console.error("Could not sync legacy user_roles:", legacyErr.message);
  process.exit(1);
}

const { count, error: permErr } = await supabase
  .from("role_permissions")
  .select("*", { count: "exact", head: true })
  .eq("role_id", OWNER_ROLE_ID);

if (permErr) {
  console.error("Could not verify owner permissions:", permErr.message);
  process.exit(1);
}

if (!count) {
  console.error(
    "Owner role has no permissions. Run: npm run db:a9 (or apply addendum_a9 migration in Supabase SQL).",
  );
  process.exit(1);
}

console.log(`OK: ${email} (${user.id}) is Owner with ${count} permissions.`);
