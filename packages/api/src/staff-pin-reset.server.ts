import { loadStaffAccess } from "@kate/api/server/permissions.server";
import { consumeStaffEmailVerificationToken } from "@kate/api/staff-email-otp.server";
import { normalizeStaffEmail } from "@kate/api/staff-email-otp.shared";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { storeStaffPin } from "@kate/api/staff-pin-auth.server";

async function findAuthUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    const match = data.users.find((user) => user.email?.toLowerCase() === normalized);
    if (match) return match;

    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

/** Reset staff PIN after a consumed forgot-PIN email verification token. */
export async function resetStaffPinAfterEmailVerification(input: {
  email: string;
  verificationToken: string;
  pin: string;
}): Promise<void> {
  const email = normalizeStaffEmail(input.email);
  await consumeStaffEmailVerificationToken({
    email,
    purpose: "forgot_pin",
    verificationToken: input.verificationToken,
  });

  const user = await findAuthUserByEmail(email);
  if (!user) {
    throw new Error("No staff account found for this email.");
  }

  const staffAccess = await loadStaffAccess(user.id);
  if (!staffAccess) {
    throw new Error("No staff account found for this email.");
  }

  await storeStaffPin(user.id, input.pin);
}
