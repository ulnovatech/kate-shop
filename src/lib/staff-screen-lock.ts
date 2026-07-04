/** Client-side staff app lock state (per browser tab). */

export const STAFF_UNLOCK_SESSION_KEY = "kate_staff_app_unlocked";

const DEFAULT_IDLE_MS = 5 * 60 * 1000;

export function markStaffAppUnlocked(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STAFF_UNLOCK_SESSION_KEY, "1");
}

export function clearStaffAppUnlock(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STAFF_UNLOCK_SESSION_KEY);
}

export function isStaffAppUnlocked(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(STAFF_UNLOCK_SESSION_KEY) === "1";
}

/** Idle timeout before auto-lock (default 5 minutes). */
export function staffScreenLockIdleMs(): number {
  const raw = import.meta.env.VITE_STAFF_SCREEN_LOCK_IDLE_MS;
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 30_000) return parsed;
  }
  return DEFAULT_IDLE_MS;
}

/**
 * PIN screen lock is implemented but off by default.
 * Set VITE_STAFF_SCREEN_LOCK_ENABLED=true to re-enable idle/background PIN prompts.
 */
export function staffScreenLockEnabled(): boolean {
  const raw = import.meta.env.VITE_STAFF_SCREEN_LOCK_ENABLED;
  return raw === "true" || raw === "1";
}
