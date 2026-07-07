import { supabaseAdmin } from "@kate/supabase/client.server";
import { userHasGoogleAuthLinkage } from "@kate/domain/staff-google-auth";
import { normalizeStaffEmail } from "@kate/api/staff-email-otp.shared";

/** Ensure the user signed in with Google and owns the expected email. */
export async function assertOAuthStaffUser(userId: string, email: string): Promise<void> {
  const { data: userRes, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error) throw new Error(error.message);

  const user = userRes.user;
  if (!user?.email) {
    throw new Error("Google account email is missing.");
  }

  if (normalizeStaffEmail(user.email) !== normalizeStaffEmail(email)) {
    throw new Error("Google account email does not match.");
  }

  if (!userHasGoogleAuthLinkage(user)) {
    throw new Error("Sign in with Google to continue.");
  }
}
