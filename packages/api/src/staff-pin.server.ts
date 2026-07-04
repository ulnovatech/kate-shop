import bcrypt from "bcryptjs";
import { z } from "zod";
import { STAFF_PIN_LENGTH } from "@kate/api/staff-pin.shared";

export { STAFF_PIN_LENGTH } from "@kate/api/staff-pin.shared";

export const STAFF_PIN_MAX_ATTEMPTS = 5;
export const STAFF_PIN_LOCK_MINUTES = 15;

export const staffPinSchema = z
  .string()
  .regex(
    new RegExp(`^\\d{${STAFF_PIN_LENGTH}}$`),
    `PIN must be ${STAFF_PIN_LENGTH} digits`,
  );

const BCRYPT_ROUNDS = 10;

export async function hashStaffPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

export async function verifyStaffPin(pin: string, pinHash: string): Promise<boolean> {
  return bcrypt.compare(pin, pinHash);
}

export function isPinLocked(lockedUntil: string | null | undefined): boolean {
  if (!lockedUntil) return false;
  return new Date(lockedUntil).getTime() > Date.now();
}

export function pinLockExpiry(attempts: number): string | null {
  if (attempts < STAFF_PIN_MAX_ATTEMPTS) return null;
  return new Date(Date.now() + STAFF_PIN_LOCK_MINUTES * 60_000).toISOString();
}
