/**
 * Staff email OTP delivery — Gmail SMTP via nodemailer.
 * Silent until EMAIL_OTP_PROVIDER=gmail and credentials are set.
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { StaffEmailOtpPurpose } from "@kate/api/staff-email-otp.server";

export type EmailOtpDeliveryResult = {
  delivered: boolean;
  /** Provider message id when delivery succeeds. */
  messageId?: string;
};

export type EmailOtpProviderId = "noop" | "gmail";

function resolveProviderId(): EmailOtpProviderId {
  const raw = (process.env.EMAIL_OTP_PROVIDER ?? "noop").trim().toLowerCase();
  if (raw === "gmail") return "gmail";
  return "noop";
}

/** True when Gmail SMTP is configured. */
export function isEmailDeliveryEnabled(): boolean {
  if (resolveProviderId() !== "gmail") return false;
  return Boolean(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim());
}

let transporter: Transporter | null | undefined;

function getGmailTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) {
    transporter = null;
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

export async function deliverStaffOtpEmail(
  email: string,
  code: string,
  purpose: StaffEmailOtpPurpose,
): Promise<EmailOtpDeliveryResult> {
  if (!isEmailDeliveryEnabled()) {
    return { delivered: false };
  }

  const transport = getGmailTransporter();
  if (!transport) return { delivered: false };

  const from = process.env.GMAIL_USER?.trim() ?? "noreply@kateshop.local";
  const subject = staffOtpSubject(purpose);
  const text = `Your Kate Admin verification code is ${code}. It expires in 10 minutes.\n\nIf you did not request this, you can ignore this email.`;

  const info = await transport.sendMail({
    from: `Kate Admin <${from}>`,
    to: email,
    subject,
    text,
  });

  return { delivered: true, messageId: info.messageId };
}

function staffOtpSubject(purpose: StaffEmailOtpPurpose): string {
  switch (purpose) {
    case "signup":
      return "Verify your email — Kate Admin setup";
    case "forgot_pin":
      return "Reset your Kate Admin PIN";
    case "invite_accept":
      return "Verify your email — Kate Admin invite";
    default:
      return "Your Kate Admin verification code";
  }
}

/** Reset cached transporter (tests). */
export function resetEmailOtpDeliveryForTests(): void {
  transporter = undefined;
}
