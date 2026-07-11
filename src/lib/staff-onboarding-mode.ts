import {
  parseStaffInviteFlowEnabled,
  parseStaffSignupEmailOtpRequired,
} from "@kate/domain/staff-onboarding-mode";

/** When false (default), invite UI stays visible but create/accept are hibernated. */
export function isStaffInviteFlowEnabled(): boolean {
  return parseStaffInviteFlowEnabled(import.meta.env.VITE_STAFF_INVITE_FLOW_ENABLED);
}

/** When false (default), staff signup skips the email verification step. */
export function isStaffSignupEmailOtpRequired(): boolean {
  return parseStaffSignupEmailOtpRequired(import.meta.env.VITE_STAFF_SIGNUP_EMAIL_OTP_REQUIRED);
}
