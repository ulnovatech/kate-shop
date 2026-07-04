import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash, randomInt } from "node:crypto";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { humanOrderStatus, humanPaymentStatus } from "@/lib/human-labels";
import { isValidUgandaPhone, normalizeUgandaPhone } from "@/lib/phone";
import { deliverOtpSms, isSmsDeliveryEnabled } from "@/lib/sms/otp-delivery";
import { allowOtpRequest, allowOtpVerify } from "@/lib/otp-rate-limit";

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

export type CustomerOrderSummary = {
  id: string;
  orderReference: string | null;
  orderStatus: string;
  orderStatusLabel: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  grandTotal: number;
  createdAt: string;
};

const phoneSchema = z.object({
  phone: z.string().trim().min(7).max(30).refine(isValidUgandaPhone),
});

const customerIdSchema = z.object({
  customerId: z.string().uuid(),
});

function mapCustomer(row: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}): CustomerProfile {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
  };
}

async function loadCustomerByPhone(phone: string): Promise<CustomerProfile | null> {
  const normalized = normalizeUgandaPhone(phone);
  if (!normalized) return null;

  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("id, name, phone, email")
    .eq("phone", normalized)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapCustomer(data) : null;
}

async function loadCustomerById(customerId: string): Promise<CustomerProfile | null> {
  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("id, name, phone, email")
    .eq("id", customerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapCustomer(data) : null;
}

/** Checkout: recognize returning customer by phone (no password). */
export const lookupCustomerByPhone = createServerFn({ method: "POST" })
  .inputValidator(phoneSchema)
  .handler(async ({ data }) => {
    const customer = await loadCustomerByPhone(data.phone);
    if (!customer) return { found: false as const };
    return { found: true as const, customer };
  });

/** Restore session from browser-stored customer id. */
export const getCustomerById = createServerFn({ method: "POST" })
  .inputValidator(customerIdSchema)
  .handler(async ({ data }) => {
    const customer = await loadCustomerById(data.customerId);
    if (!customer) return null;
    return customer;
  });

export const listCustomerOrders = createServerFn({ method: "POST" })
  .inputValidator(customerIdSchema)
  .handler(async ({ data }) => {
    const customer = await loadCustomerById(data.customerId);
    if (!customer) return [];

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_reference, order_status, payment_status, grand_total, total, created_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    return (orders ?? []).map(
      (o): CustomerOrderSummary => ({
        id: o.id,
        orderReference: o.order_reference,
        orderStatus: o.order_status ?? "awaiting_payment",
        orderStatusLabel: humanOrderStatus(o.order_status),
        paymentStatus: o.payment_status,
        paymentStatusLabel: humanPaymentStatus(o.payment_status),
        grandTotal: Number(o.grand_total ?? o.total),
        createdAt: o.created_at,
      }),
    );
  });

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

const otpRequestSchema = z.object({
  phone: z.string().trim().min(7).max(30).refine(isValidUgandaPhone),
});

/** Whether SMS OTP delivery is wired (silent off until SMS_OTP_PROVIDER is set). */
export const getOtpDeliveryStatus = createServerFn({ method: "GET" }).handler(() => ({
  smsEnabled: isSmsDeliveryEnabled(),
}));

/** Optional verification when viewing orders on a new device (requires SMS provider). */
export const requestCustomerOtp = createServerFn({ method: "POST" })
  .inputValidator(otpRequestSchema)
  .handler(async ({ data }) => {
    if (!isSmsDeliveryEnabled()) {
      throw new Error(
        "Phone verification is not available yet. Use the same device you ordered from.",
      );
    }

    const normalized = normalizeUgandaPhone(data.phone);
    if (!normalized) throw new Error("Enter a valid Uganda mobile number");
    if (!allowOtpRequest(normalized)) {
      throw new Error("Too many verification requests. Try again in an hour.");
    }

    const customer = await loadCustomerByPhone(normalized);
    if (!customer) {
      throw new Error("No orders found for this phone number yet.");
    }

    const code = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    const { error } = await supabaseAdmin.from("customer_phone_verifications").insert({
      phone: normalized,
      code_hash: hashOtp(code),
      expires_at: expiresAt,
    });

    if (error) throw new Error(error.message);

    const delivery = await deliverOtpSms(normalized, code);
    if (!delivery.delivered) {
      throw new Error("Could not send verification code. Try again shortly.");
    }

    const isDev = process.env.NODE_ENV !== "production";

    return {
      sent: true,
      expiresInSeconds: OTP_TTL_MS / 1000,
      /** Dev echo only when explicitly enabled — never leak codes in production. */
      devCode: isDev && process.env.SMS_OTP_DEV_ECHO === "1" ? code : undefined,
    };
  });

const otpVerifySchema = z.object({
  phone: z.string().trim().min(7).max(30).refine(isValidUgandaPhone),
  code: z.string().trim().length(6),
});

export const verifyCustomerOtp = createServerFn({ method: "POST" })
  .inputValidator(otpVerifySchema)
  .handler(async ({ data }) => {
    const normalized = normalizeUgandaPhone(data.phone);
    if (!normalized) throw new Error("Enter a valid Uganda mobile number");
    if (!allowOtpVerify(normalized)) {
      throw new Error("Too many verification attempts. Try again in an hour.");
    }

    const { data: challenge, error } = await supabaseAdmin
      .from("customer_phone_verifications")
      .select("id, code_hash, expires_at, attempts")
      .eq("phone", normalized)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!challenge) throw new Error("No verification code found. Request a new one.");
    if (new Date(challenge.expires_at) < new Date()) {
      throw new Error("This code has expired. Request a new one.");
    }
    if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
      throw new Error("Too many attempts. Request a new code.");
    }

    const valid = challenge.code_hash === hashOtp(data.code);
    await supabaseAdmin
      .from("customer_phone_verifications")
      .update({ attempts: challenge.attempts + 1 })
      .eq("id", challenge.id);

    if (!valid) throw new Error("Incorrect code. Try again.");

    const customer = await loadCustomerByPhone(normalized);
    if (!customer) throw new Error("Customer not found.");

    return { customer };
  });
