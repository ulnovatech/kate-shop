#!/usr/bin/env node
/**
 * Verify staff email OTP configuration and optionally send a test message.
 * Usage:
 *   npm run staff:verify-email-otp
 *   npm run staff:verify-email-otp -- --send owner@example.com
 */
import { loadEnv } from "./load-env.mjs";

loadEnv();

const sendTo = process.argv.includes("--send")
  ? process.argv[process.argv.indexOf("--send") + 1]?.trim()
  : null;

const { getEmailOtpProviderId, isEmailOtpDeliveryConfigured, deliverStaffOtpEmail } =
  await import("../src/lib/email/otp-delivery.ts");

const provider = getEmailOtpProviderId();
const configured = isEmailOtpDeliveryConfigured();

console.log("Staff email OTP configuration\n");
console.log(`  Provider:      ${provider}`);
console.log(`  Configured:    ${configured ? "yes" : "no"}`);
console.log(`  GMAIL_USER:    ${process.env.GMAIL_USER?.trim() ? "set" : "missing"}`);
console.log(`  GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD?.trim() ? "set" : "missing"}`);

if (!configured) {
  console.error(
    "\nEmail OTP is not configured. Set EMAIL_OTP_PROVIDER=gmail with GMAIL_USER and GMAIL_APP_PASSWORD in .env",
  );
  process.exit(1);
}

if (!sendTo) {
  console.log("\nOK — delivery is configured. Pass --send you@example.com to send a test code.");
  process.exit(0);
}

const code = "123456";

console.log(`\nSending test OTP to ${sendTo}…`);

try {
  const result = await deliverStaffOtpEmail(sendTo, code, "signup");
  if (!result.delivered) {
    console.error("Delivery failed — check Gmail credentials and network.");
    process.exit(1);
  }
  console.log(`Delivered (messageId: ${result.messageId ?? "n/a"}). Check inbox for code ${code}.`);
} catch (error) {
  console.error("Delivery error:", error instanceof Error ? error.message : error);
  process.exit(1);
}
