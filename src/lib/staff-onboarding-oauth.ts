import { supabase } from "@/integrations/supabase/client";
import { userHasGoogleAuthLinkage } from "@kate/domain/staff-google-auth";
import { resolveStaffAuthRedirectTo } from "@/integrations/supabase/staff-mobile-auth";
import { isStaffGoogleAuthEnabled } from "@/lib/staff-google-auth-enabled";
import { savePendingStaffInviteToken } from "@/lib/staff-invite-pending";

export type StaffOnboardingOAuthFlow =
  | { kind: "bootstrap"; bootstrapToken?: string }
  | { kind: "invite"; token: string };

const STORAGE_KEY = "staff_onboarding_oauth";

export function saveStaffOnboardingOAuth(flow: StaffOnboardingOAuthFlow): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(flow));
}

export function loadStaffOnboardingOAuth(): StaffOnboardingOAuthFlow | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StaffOnboardingOAuthFlow;
    if (parsed?.kind === "bootstrap" || parsed?.kind === "invite") {
      return parsed;
    }
  } catch {
    // ignore malformed state
  }
  return null;
}

export function clearStaffOnboardingOAuth(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export async function startStaffGoogleOnboarding(flow: StaffOnboardingOAuthFlow): Promise<void> {
  if (!isStaffGoogleAuthEnabled()) {
    throw new Error("Google sign-in is not available.");
  }

  saveStaffOnboardingOAuth(flow);
  if (flow.kind === "invite") {
    savePendingStaffInviteToken(flow.token);
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: resolveStaffAuthRedirectTo(),
    },
  });
  if (error) throw error;
}

export type GoogleOnboardingSession = {
  userId: string;
  email: string;
};

/** Active Supabase session from Google OAuth during onboarding. */
export async function getGoogleOnboardingSession(): Promise<GoogleOnboardingSession | null> {
  if (!isStaffGoogleAuthEnabled()) return null;

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email || !user.id) return null;

  if (!userHasGoogleAuthLinkage(user)) return null;

  return { userId: user.id, email: user.email };
}

/** Resume Google invite onboarding after OAuth redirect (handles auth hydration races). */
export async function tryResumeStaffGoogleInviteOnboarding(
  inviteToken?: string | null,
): Promise<GoogleOnboardingSession | null> {
  const flow = loadStaffOnboardingOAuth();
  if (flow?.kind !== "invite") return null;
  if (inviteToken && flow.token !== inviteToken) return null;

  return getGoogleOnboardingSession();
}
