import {
  coerceStaffRole,
  OPEN_STAFF_ROLE_STORAGE_KEY,
  parseStaffAuthRequired,
} from "@kate/domain/staff-auth-mode";
import type { StaffRole } from "@kate/domain/db/contracts";
import { adminUrl } from "@/lib/admin-base-path";
import { defaultAdminPath } from "@/lib/rbac";

export const OPEN_STAFF_ROLE_CHANGED_EVENT = "kate-open-staff-role";

/** When false (default), login/signup are hibernated — open admin entry. */
export function isStaffAuthRequired(): boolean {
  return parseStaffAuthRequired(import.meta.env.VITE_STAFF_AUTH_REQUIRED);
}

export function isStaffOpenMode(): boolean {
  return !isStaffAuthRequired();
}

export function getOpenStaffRole(): StaffRole {
  if (typeof window === "undefined") return "staff";
  try {
    return coerceStaffRole(window.sessionStorage.getItem(OPEN_STAFF_ROLE_STORAGE_KEY));
  } catch {
    return "staff";
  }
}

export function setOpenStaffRole(role: StaffRole | string): StaffRole {
  const next = coerceStaffRole(role);
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(OPEN_STAFF_ROLE_STORAGE_KEY, next);
      window.dispatchEvent(new Event(OPEN_STAFF_ROLE_CHANGED_EVENT));
    } catch {
      // ignore quota / private mode
    }
  }
  return next;
}

export function openStaffHomePath(role?: StaffRole | string | null): string {
  return defaultAdminPath(coerceStaffRole(role ?? getOpenStaffRole()));
}

/** Absolute role-entry URL for sharing while auth is hibernated. */
export function buildOpenRoleEntryUrl(role: StaffRole | string): string {
  const path = adminUrl(`/r/${coerceStaffRole(role)}`);
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
}
