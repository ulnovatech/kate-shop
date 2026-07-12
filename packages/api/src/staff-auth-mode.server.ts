import {
  parseStaffAuthRequired,
  OPEN_STAFF_ACTOR_ID,
  KATE_OPEN_ROLE_HEADER,
  parseOpenStaffRoleHeader,
} from "@kate/domain/staff-auth-mode";

export { OPEN_STAFF_ACTOR_ID, KATE_OPEN_ROLE_HEADER, parseOpenStaffRoleHeader };

/** When false (default), staff login is hibernated — open role entry. */
export function isStaffAuthRequired(): boolean {
  return parseStaffAuthRequired(
    process.env.STAFF_AUTH_REQUIRED ?? process.env.VITE_STAFF_AUTH_REQUIRED,
  );
}
