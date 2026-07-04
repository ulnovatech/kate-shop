type FcmSendResult = { ok: true } | { ok: false; error: string };

/** Legacy FCM HTTP API — silent until FCM_SERVER_KEY is configured (C12). */
export async function sendFcmPush(input: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<FcmSendResult> {
  const serverKey = process.env.FCM_SERVER_KEY?.trim();
  if (!serverKey) {
    return { ok: false, error: "FCM_SERVER_KEY not configured" };
  }

  const response = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${serverKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: input.token,
      priority: "high",
      notification: {
        title: input.title,
        body: input.body,
      },
      data: input.data ?? {},
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: number;
    failure?: number;
    results?: Array<{ error?: string }>;
  };

  if (!response.ok) {
    return { ok: false, error: `FCM HTTP ${response.status}` };
  }

  if (payload.failure && payload.failure > 0) {
    const err = payload.results?.[0]?.error ?? "FCM delivery failed";
    return { ok: false, error: err };
  }

  return { ok: true };
}
