/** Parse env flag — Google staff auth is off unless explicitly enabled. */
export function parseStaffGoogleAuthEnabled(value: string | undefined | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export type GoogleAuthUserLike = {
  identities?: Array<{ provider?: string | null }> | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

/** True when the auth user is linked to Google (OAuth). */
export function userHasGoogleAuthLinkage(user: GoogleAuthUserLike): boolean {
  if (user.identities?.some((identity) => identity.provider === "google")) {
    return true;
  }

  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers) && providers.some((provider) => provider === "google")) {
    return true;
  }

  if (user.app_metadata?.provider === "google") {
    return true;
  }

  const iss = user.user_metadata?.iss;
  if (typeof iss === "string" && iss.includes("accounts.google.com")) {
    return true;
  }

  return false;
}
