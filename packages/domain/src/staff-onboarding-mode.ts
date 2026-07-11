/** Staff onboarding mode — invite/OTP flows can be hibernated for a simpler install + signup path. */

/** Parse env flag — staff invite links are OFF unless explicitly enabled. */
export function parseStaffInviteFlowEnabled(value: string | undefined | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

/** Parse env flag — email OTP on staff signup is OFF unless explicitly enabled. */
export function parseStaffSignupEmailOtpRequired(value: string | undefined | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}
