import { STAFF_ROLES, type StaffRole } from "./db/contracts";

/** Sentinel actor id for open-mode audits (not a real auth.users row). */
export const OPEN_STAFF_ACTOR_ID = "00000000-0000-4000-8000-0000000000de";

export const KATE_OPEN_ROLE_HEADER = "x-kate-open-role";

export const OPEN_STAFF_ROLE_STORAGE_KEY = "kate_admin_open_staff_role";

/** Parse env — staff auth/login is OFF unless explicitly required. */
export function parseStaffAuthRequired(value: string | undefined | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function isStaffRoleSlug(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

/** Map any role slug to a known StaffRole (custom roles → staff). */
export function coerceStaffRole(value: string | null | undefined): StaffRole {
  if (!value) return "staff";
  const normalized = value.trim().toLowerCase();
  if (isStaffRoleSlug(normalized)) return normalized;
  if (normalized === "admin") return "admin";
  if (normalized === "manager") return "manager";
  if (normalized === "owner") return "owner";
  return "staff";
}

export function parseOpenStaffRoleHeader(value: string | null | undefined): StaffRole {
  return coerceStaffRole(value);
}
