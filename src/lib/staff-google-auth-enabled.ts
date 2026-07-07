import { parseStaffGoogleAuthEnabled } from "@kate/domain/staff-google-auth";

export function isStaffGoogleAuthEnabled(): boolean {
  return parseStaffGoogleAuthEnabled(import.meta.env.VITE_STAFF_GOOGLE_AUTH_ENABLED);
}
