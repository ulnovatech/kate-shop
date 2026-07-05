import { supabaseAdmin } from "@kate/supabase/client.server";
import type { AuthContext } from "@kate/api/auth-middleware.server";
import {
  consumeStaffEmailVerificationToken,
  normalizeStaffEmail,
  requestStaffEmailOtpImpl,
} from "@kate/api/staff-email-otp.server";
import { auditFromServer } from "@kate/api/audit.server";

async function findAuthUserByEmail(email: string) {
  const normalized = normalizeStaffEmail(email);
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

export async function requestStaffEmailChangeOtp(auth: AuthContext, newEmail: string) {
  const currentEmail = auth.email;
  if (!currentEmail) throw new Error("Account email is missing.");

  const normalizedNew = normalizeStaffEmail(newEmail);
  if (normalizedNew === normalizeStaffEmail(currentEmail)) {
    throw new Error("That is already your email address.");
  }

  const existing = await findAuthUserByEmail(normalizedNew);
  if (existing && existing.id !== auth.userId) {
    throw new Error("This email is already used by another account.");
  }

  return requestStaffEmailOtpImpl({ email: normalizedNew, purpose: "change_email" });
}

export async function updateStaffEmailAddress(
  auth: AuthContext,
  newEmail: string,
  verificationToken: string,
) {
  const currentEmail = auth.email;
  if (!currentEmail) throw new Error("Account email is missing.");

  const normalizedNew = normalizeStaffEmail(newEmail);
  if (normalizedNew === normalizeStaffEmail(currentEmail)) {
    throw new Error("That is already your email address.");
  }

  const existing = await findAuthUserByEmail(normalizedNew);
  if (existing && existing.id !== auth.userId) {
    throw new Error("This email is already used by another account.");
  }

  await consumeStaffEmailVerificationToken({
    email: normalizedNew,
    purpose: "change_email",
    verificationToken,
  });

  const { error } = await supabaseAdmin.auth.admin.updateUserById(auth.userId, {
    email: normalizedNew,
    email_confirm: true,
  });
  if (error) throw new Error(error.message);

  await auditFromServer(auth.userId, "staff_email_updated", "user", auth.userId, null, {
    previousEmail: currentEmail,
    email: normalizedNew,
  });

  return { email: normalizedNew };
}

export async function requestStaffRecoveryPasswordOtp(auth: AuthContext) {
  const email = auth.email;
  if (!email) throw new Error("Account email is missing.");
  return requestStaffEmailOtpImpl({
    email: normalizeStaffEmail(email),
    purpose: "change_password",
  });
}

export async function updateStaffRecoveryPassword(
  auth: AuthContext,
  verificationToken: string,
  password: string,
) {
  const email = auth.email;
  if (!email) throw new Error("Account email is missing.");

  await consumeStaffEmailVerificationToken({
    email: normalizeStaffEmail(email),
    purpose: "change_password",
    verificationToken,
  });

  const { error } = await supabaseAdmin.auth.admin.updateUserById(auth.userId, { password });
  if (error) throw new Error(error.message);

  await auditFromServer(auth.userId, "staff_password_updated", "user", auth.userId, null, {
    email: normalizeStaffEmail(email),
  });

  return { ok: true as const };
}
