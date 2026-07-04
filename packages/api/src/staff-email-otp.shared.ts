export const STAFF_EMAIL_OTP_TTL_MS = 10 * 60 * 1000;
export const STAFF_EMAIL_VERIFICATION_TOKEN_TTL_MS = 15 * 60 * 1000;
export const STAFF_EMAIL_OTP_MAX_ATTEMPTS = 5;

export const STAFF_EMAIL_OTP_PURPOSES = ["signup", "forgot_pin", "invite_accept"] as const;
export type StaffEmailOtpPurpose = (typeof STAFF_EMAIL_OTP_PURPOSES)[number];

export function isStaffEmailOtpPurpose(value: string): value is StaffEmailOtpPurpose {
  return (STAFF_EMAIL_OTP_PURPOSES as readonly string[]).includes(value);
}

export function normalizeStaffEmail(email: string): string {
  return email.trim().toLowerCase();
}
