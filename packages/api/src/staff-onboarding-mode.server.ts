import {
  parseStaffInviteFlowEnabled,
  parseStaffSignupEmailOtpRequired,
} from "@kate/domain/staff-onboarding-mode";

/** When false (default), invite links / one-time tokens are hibernated. */
export function isStaffInviteFlowEnabled(): boolean {
  return parseStaffInviteFlowEnabled(
    process.env.STAFF_INVITE_FLOW_ENABLED ?? process.env.VITE_STAFF_INVITE_FLOW_ENABLED,
  );
}

export function assertStaffInviteFlowEnabled(): void {
  if (!isStaffInviteFlowEnabled()) {
    throw new Error(
      "Staff invites are paused. Share the install link and ask teammates to Sign up with email and PIN.",
    );
  }
}

/** When false (default), staff signup skips email OTP verification. */
export function isStaffSignupEmailOtpRequired(): boolean {
  return parseStaffSignupEmailOtpRequired(
    process.env.STAFF_SIGNUP_EMAIL_OTP_REQUIRED ?? process.env.VITE_STAFF_SIGNUP_EMAIL_OTP_REQUIRED,
  );
}
