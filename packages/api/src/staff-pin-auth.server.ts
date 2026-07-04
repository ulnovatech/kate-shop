import { supabaseAdmin } from "@kate/supabase/client.server";
import {
  hashStaffPin,
  isPinLocked,
  pinLockExpiry,
  STAFF_PIN_MAX_ATTEMPTS,
  verifyStaffPin,
} from "@kate/api/staff-pin.server";

export const INVALID_PIN_MESSAGE = "Invalid email or PIN.";
export const NO_PIN_MESSAGE = "No PIN is set for this account. Complete setup or use Forgot PIN.";

export async function storeStaffPin(userId: string, pin: string): Promise<void> {
  const pin_hash = await hashStaffPin(pin);
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("staff_pin_credentials").upsert(
    {
      user_id: userId,
      pin_hash,
      failed_attempts: 0,
      locked_until: null,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}

async function recordPinFailure(userId: string): Promise<void> {
  const { data: row, error: readErr } = await supabaseAdmin
    .from("staff_pin_credentials")
    .select("failed_attempts")
    .eq("user_id", userId)
    .maybeSingle();

  if (readErr) throw new Error(readErr.message);
  if (!row) return;

  const failed_attempts = row.failed_attempts + 1;
  const { error } = await supabaseAdmin
    .from("staff_pin_credentials")
    .update({
      failed_attempts,
      locked_until: pinLockExpiry(failed_attempts),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

async function clearPinFailures(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("staff_pin_credentials")
    .update({
      failed_attempts: 0,
      locked_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

/** Verify a staff PIN for an existing user (login, screen lock, PIN change). */
export async function assertStaffPinValid(userId: string, pin: string): Promise<void> {
  const { data: creds, error: credsErr } = await supabaseAdmin
    .from("staff_pin_credentials")
    .select("pin_hash, failed_attempts, locked_until")
    .eq("user_id", userId)
    .maybeSingle();

  if (credsErr) throw new Error(credsErr.message);
  if (!creds) {
    throw new Error(NO_PIN_MESSAGE);
  }

  if (isPinLocked(creds.locked_until)) {
    throw new Error("Too many incorrect PIN attempts. Try again in a few minutes.");
  }

  const valid = await verifyStaffPin(pin, creds.pin_hash);
  if (!valid) {
    await recordPinFailure(userId);
    const attemptsLeft = Math.max(0, STAFF_PIN_MAX_ATTEMPTS - creds.failed_attempts - 1);
    if (attemptsLeft === 0) {
      throw new Error("Too many incorrect PIN attempts. Try again in a few minutes.");
    }
    throw new Error(INVALID_PIN_MESSAGE);
  }

  await clearPinFailures(userId);
}
