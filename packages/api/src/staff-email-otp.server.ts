import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { loadStaffAccess } from "@kate/api/server/permissions.server";
import {
  deliverStaffOtpEmail,
  isEmailDeliveryEnabled,
} from "@/lib/email/otp-delivery";
import {
  allowStaffEmailOtpRequest,
  allowStaffEmailOtpVerify,
} from "@/lib/otp-rate-limit";
import {
  normalizeStaffEmail,
  STAFF_EMAIL_OTP_MAX_ATTEMPTS,
  STAFF_EMAIL_OTP_TTL_MS,
  STAFF_EMAIL_VERIFICATION_TOKEN_TTL_MS,
  isStaffEmailOtpPurpose,
  type StaffEmailOtpPurpose,
} from "@kate/api/staff-email-otp.shared";

export {
  STAFF_EMAIL_OTP_TTL_MS,
  STAFF_EMAIL_VERIFICATION_TOKEN_TTL_MS,
  STAFF_EMAIL_OTP_MAX_ATTEMPTS,
  STAFF_EMAIL_OTP_PURPOSES,
  isStaffEmailOtpPurpose,
  normalizeStaffEmail,
  type StaffEmailOtpPurpose,
} from "@kate/api/staff-email-otp.shared";

export function hashStaffEmailOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function generateStaffEmailOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export function generateStaffEmailVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashStaffEmailVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function staffEmailOtpCodesMatch(storedHash: string, code: string): boolean {
  const actual = hashStaffEmailOtp(code);
  try {
    return timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(actual, "hex"));
  } catch {
    return storedHash === actual;
  }
}

export function staffEmailVerificationTokensMatch(storedHash: string, token: string): boolean {
  const actual = hashStaffEmailVerificationToken(token);
  try {
    return timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(actual, "hex"));
  } catch {
    return storedHash === actual;
  }
}

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

async function assertCanRequestOtp(email: string, purpose: StaffEmailOtpPurpose): Promise<void> {
  const normalized = normalizeStaffEmail(email);

  if (purpose === "signup") {
    const existing = await findAuthUserByEmail(normalized);
    if (existing) {
      const access = await loadStaffAccess(existing.id);
      if (access) {
        throw new Error("This email already has a staff account. Sign in instead.");
      }
    }
    return;
  }

  if (purpose === "forgot_pin") {
    const user = await findAuthUserByEmail(normalized);
    if (!user) {
      throw new Error("No staff account found for this email.");
    }
    const access = await loadStaffAccess(user.id);
    if (!access) {
      throw new Error("No staff account found for this email.");
    }
    const { data: pinRow } = await supabaseAdmin
      .from("staff_pin_credentials")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!pinRow) {
      throw new Error("No PIN is set for this account. Complete setup or ask your shop owner.");
    }
    return;
  }

  if (purpose === "invite_accept") {
    const { data: invite, error } = await supabaseAdmin
      .from("admin_invites")
      .select("id, expires_at, used_at")
      .eq("email", normalized)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!invite) {
      throw new Error("No pending invite found for this email.");
    }
    if (new Date(invite.expires_at) < new Date()) {
      throw new Error("This invite has expired. Ask your shop owner for a new link.");
    }
  }
}

export function getStaffEmailOtpDeliveryStatusImpl() {
  return { emailEnabled: isEmailDeliveryEnabled() };
}

export async function requestStaffEmailOtpImpl(data: {
  email: string;
  purpose: StaffEmailOtpPurpose;
}) {
  const email = normalizeStaffEmail(data.email);
  const purpose = data.purpose;

  if (!isStaffEmailOtpPurpose(purpose)) {
    throw new Error("Invalid verification purpose.");
  }

  if (!isEmailDeliveryEnabled()) {
    throw new Error(
      "Email verification is not configured. Set EMAIL_OTP_PROVIDER=gmail and Gmail credentials.",
    );
  }

  if (!allowStaffEmailOtpRequest(email, purpose)) {
    throw new Error("Too many verification requests. Try again in an hour.");
  }

  await assertCanRequestOtp(email, purpose);

  const code = generateStaffEmailOtpCode();
  const expiresAt = new Date(Date.now() + STAFF_EMAIL_OTP_TTL_MS).toISOString();

  const { error } = await supabaseAdmin.from("staff_email_verifications").insert({
    email,
    code_hash: hashStaffEmailOtp(code),
    purpose,
    expires_at: expiresAt,
  });

  if (error) throw new Error(error.message);

  const delivery = await deliverStaffOtpEmail(email, code, purpose);
  if (!delivery.delivered) {
    throw new Error("Could not send verification email. Try again shortly.");
  }

  return {
    sent: true as const,
    expiresInSeconds: STAFF_EMAIL_OTP_TTL_MS / 1000,
  };
}

export async function verifyStaffEmailOtpImpl(data: {
  email: string;
  purpose: StaffEmailOtpPurpose;
  code: string;
}) {
  const email = normalizeStaffEmail(data.email);
  const purpose = data.purpose;

  if (!allowStaffEmailOtpVerify(email, purpose)) {
    throw new Error("Too many verification attempts. Try again in an hour.");
  }

  const { data: challenge, error } = await supabaseAdmin
    .from("staff_email_verifications")
    .select(
      "id, code_hash, expires_at, attempts, consumed_at, verification_token_hash, verification_expires_at",
    )
    .eq("email", email)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!challenge) {
    throw new Error("No verification code found. Request a new one.");
  }
  if (new Date(challenge.expires_at) < new Date()) {
    throw new Error("This code has expired. Request a new one.");
  }
  if (challenge.attempts >= STAFF_EMAIL_OTP_MAX_ATTEMPTS) {
    throw new Error("Too many attempts. Request a new code.");
  }

  const valid = staffEmailOtpCodesMatch(challenge.code_hash, data.code);
  await supabaseAdmin
    .from("staff_email_verifications")
    .update({ attempts: challenge.attempts + 1 })
    .eq("id", challenge.id);

  if (!valid) {
    throw new Error("Incorrect code. Try again.");
  }

  const verificationToken = generateStaffEmailVerificationToken();
  const verificationExpiresAt = new Date(
    Date.now() + STAFF_EMAIL_VERIFICATION_TOKEN_TTL_MS,
  ).toISOString();
  const now = new Date().toISOString();

  const { error: updateErr } = await supabaseAdmin
    .from("staff_email_verifications")
    .update({
      consumed_at: now,
      verification_token_hash: hashStaffEmailVerificationToken(verificationToken),
      verification_expires_at: verificationExpiresAt,
    })
    .eq("id", challenge.id);

  if (updateErr) throw new Error(updateErr.message);

  return {
    verificationToken,
    expiresInSeconds: STAFF_EMAIL_VERIFICATION_TOKEN_TTL_MS / 1000,
  };
}

type ConsumeVerificationInput = {
  email: string;
  purpose: StaffEmailOtpPurpose;
  verificationToken: string;
};

/** Validates a post-verify token (used by signup, forgot PIN, invite flows). */
export async function consumeStaffEmailVerificationToken({
  email,
  purpose,
  verificationToken,
}: ConsumeVerificationInput): Promise<void> {
  const normalized = normalizeStaffEmail(email);

  const { data: row, error } = await supabaseAdmin
    .from("staff_email_verifications")
    .select("id, verification_token_hash, verification_expires_at, consumed_at")
    .eq("email", normalized)
    .eq("purpose", purpose)
    .not("verification_token_hash", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row?.verification_token_hash || !row.verification_expires_at) {
    throw new Error("Email verification expired. Request a new code.");
  }
  if (!row.consumed_at) {
    throw new Error("Email verification expired. Request a new code.");
  }
  if (new Date(row.verification_expires_at) < new Date()) {
    throw new Error("Email verification expired. Request a new code.");
  }
  if (!staffEmailVerificationTokensMatch(row.verification_token_hash, verificationToken)) {
    throw new Error("Invalid verification. Request a new code.");
  }

  const { error: markErr } = await supabaseAdmin
    .from("staff_email_verifications")
    .update({
      verification_token_hash: null,
      verification_expires_at: null,
    })
    .eq("id", row.id);

  if (markErr) throw new Error(markErr.message);
}
