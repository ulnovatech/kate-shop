/**
 * OTP SMS delivery — silent by default until a provider is configured.
 * Wire Africa's Talking, WesendAll, EgoSMS, etc. by setting SMS_OTP_PROVIDER.
 */

export type OtpDeliveryResult = {
  delivered: boolean;
  /** Provider message id when delivery succeeds. */
  messageId?: string;
  /** Dev-only: code echoed when delivery is noop (never in production responses). */
  devEcho?: string;
};

export type OtpSmsProvider = {
  name: string;
  sendOtp: (phone: string, code: string) => Promise<OtpDeliveryResult>;
};

export type SmsProviderId = "noop" | "africas_talking" | "wesendall" | "egosms";

function resolveProviderId(): SmsProviderId {
  const raw = (process.env.SMS_OTP_PROVIDER ?? "noop").trim().toLowerCase();
  if (raw === "africas_talking" || raw === "at") return "africas_talking";
  if (raw === "wesendall") return "wesendall";
  if (raw === "egosms") return "egosms";
  return "noop";
}

/** True when a real SMS provider is configured with required credentials. */
export function isSmsDeliveryEnabled(): boolean {
  const id = resolveProviderId();
  if (id === "noop") return false;
  if (id === "africas_talking") {
    return Boolean(process.env.AFRICAS_TALKING_API_KEY && process.env.AFRICAS_TALKING_USERNAME);
  }
  if (id === "wesendall") {
    return Boolean(
      process.env.WESENDALL_API_KEY &&
      process.env.WESENDALL_API_SECRET &&
      process.env.WESENDALL_WALLET_ID,
    );
  }
  if (id === "egosms") {
    return Boolean(
      process.env.EGOSMS_USERNAME && (process.env.EGOSMS_PASSWORD || process.env.EGOSMS_API_KEY),
    );
  }
  return false;
}

const noopProvider: OtpSmsProvider = {
  name: "noop",
  async sendOtp() {
    return { delivered: false };
  },
};

async function sendViaAfricasTalking(phone: string, code: string): Promise<OtpDeliveryResult> {
  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const username = process.env.AFRICAS_TALKING_USERNAME;
  const senderId = process.env.AFRICAS_TALKING_SENDER_ID ?? "KATESHOP";
  if (!apiKey || !username) return { delivered: false };

  const body = new URLSearchParams({
    username,
    to: phone.startsWith("+") ? phone : `+${phone}`,
    message: `Your Kate Shop verification code is ${code}. Valid for 10 minutes.`,
    from: senderId,
  });

  const res = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      apiKey,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SMS delivery failed (${res.status})${text ? `: ${text.slice(0, 120)}` : ""}`);
  }

  const json = (await res.json().catch(() => ({}))) as {
    SMSMessageData?: { Recipients?: { messageId?: string }[] };
  };
  const messageId = json.SMSMessageData?.Recipients?.[0]?.messageId;
  return { delivered: true, messageId };
}

function formatSmsPhone(phone: string): string {
  return phone.startsWith("+") ? phone : `+${phone}`;
}

async function sendViaWesendAll(phone: string, code: string): Promise<OtpDeliveryResult> {
  const apiKey = process.env.WESENDALL_API_KEY;
  const apiSecret = process.env.WESENDALL_API_SECRET;
  const walletId = process.env.WESENDALL_WALLET_ID;
  if (!apiKey || !apiSecret || !walletId) return { delivered: false };

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const message = `Your Kate Shop verification code is ${code}. Valid for 10 minutes.`;

  const res = await fetch("https://www.wesendall.com/api/v1/sms/send", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      walletId,
      message,
      recipient: [formatSmsPhone(phone)],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WesendAll SMS failed (${res.status})${text ? `: ${text.slice(0, 120)}` : ""}`);
  }

  const json = (await res.json().catch(() => ({}))) as { id?: string; messageId?: string };
  return { delivered: true, messageId: json.id ?? json.messageId };
}

async function sendViaEgoSms(phone: string, code: string): Promise<OtpDeliveryResult> {
  const username = process.env.EGOSMS_USERNAME;
  const password = process.env.EGOSMS_PASSWORD ?? process.env.EGOSMS_API_KEY;
  const sender = process.env.EGOSMS_SENDER_ID ?? "KATESHOP";
  if (!username || !password) return { delivered: false };

  const message = `Your Kate Shop verification code is ${code}. Valid for 10 minutes.`;
  const params = new URLSearchParams({
    username,
    password,
    number: formatSmsPhone(phone),
    message,
    sender,
    priority: "0",
  });

  const res = await fetch(`https://www.egosms.co/api/v1/plain/?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "text/plain" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`EgoSMS failed (${res.status})${text ? `: ${text.slice(0, 120)}` : ""}`);
  }

  const body = (await res.text()).trim().toLowerCase();
  if (body.includes("error") || body.includes("fail")) {
    throw new Error(`EgoSMS rejected message: ${body.slice(0, 120)}`);
  }

  return { delivered: true };
}

function getProvider(): OtpSmsProvider {
  const id = resolveProviderId();
  if (!isSmsDeliveryEnabled()) return noopProvider;

  if (id === "africas_talking") {
    return { name: "africas_talking", sendOtp: sendViaAfricasTalking };
  }
  if (id === "wesendall") {
    return { name: "wesendall", sendOtp: sendViaWesendAll };
  }
  if (id === "egosms") {
    return { name: "egosms", sendOtp: sendViaEgoSms };
  }

  return noopProvider;
}

export async function deliverOtpSms(phone: string, code: string): Promise<OtpDeliveryResult> {
  const provider = getProvider();
  return provider.sendOtp(phone, code);
}
