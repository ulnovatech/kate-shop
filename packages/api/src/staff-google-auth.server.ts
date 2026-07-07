import { parseStaffGoogleAuthEnabled } from "@kate/domain/staff-google-auth";

export function isStaffGoogleAuthEnabled(): boolean {
  return parseStaffGoogleAuthEnabled(
    process.env.STAFF_GOOGLE_AUTH_ENABLED ?? process.env.VITE_STAFF_GOOGLE_AUTH_ENABLED,
  );
}

export function assertStaffGoogleAuthEnabled(): void {
  if (!isStaffGoogleAuthEnabled()) {
    throw new Error("Google sign-in is not available.");
  }
}
