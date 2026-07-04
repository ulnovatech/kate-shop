import { supabase } from "@/integrations/supabase/client";
import { resolveStaffAuthRedirectTo } from "@/integrations/supabase/staff-mobile-auth";

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
  saveStaffOnboardingOAuth(flow);
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
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email || !user.id) return null;

  const hasGoogle = user.identities?.some((identity) => identity.provider === "google");
  if (!hasGoogle) return null;

  return { userId: user.id, email: user.email };
}
