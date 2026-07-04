import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";
import { registerStaffPushToken } from "@/lib/api/staff-push.functions";

let initStarted = false;

/** Native FCM is opt-in — without google-services.json, register() can crash Android. */
export function isStaffPushNativeEnabled(): boolean {
  return import.meta.env.VITE_STAFF_PUSH_NATIVE === "true";
}

function deviceLabel(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  const platform = navigator.userAgent?.slice(0, 80);
  return platform || undefined;
}

async function registerToken(token: string) {
  await registerStaffPushToken({
    data: {
      token,
      platform: "fcm",
      deviceLabel: deviceLabel(),
    },
  });
}

function navigateFromNotificationData(
  navigate: (opts: { to: string; replace?: boolean }) => void,
  data: Record<string, unknown> | undefined,
) {
  const path =
    (typeof data?.path === "string" && data.path) ||
    (typeof data?.orderId === "string" ? `/orders/${encodeURIComponent(data.orderId)}` : null);
  if (path) {
    navigate({ to: path, replace: false });
  }
}

/** Register FCM and listen for push taps (C12 — only when VITE_STAFF_PUSH_NATIVE=true). */
export async function initStaffPush(
  navigate: (opts: { to: string; replace?: boolean }) => void,
): Promise<void> {
  if (!isNativeStaffApp() || !isStaffPushNativeEnabled() || initStarted) return;
  initStarted = true;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== "granted") return;

    await PushNotifications.addListener("registration", (event) => {
      void registerToken(event.value).catch((error) => {
        console.warn("[staff-push] token registration failed:", error);
      });
    });

    await PushNotifications.addListener("registrationError", (error) => {
      console.warn("[staff-push] registration error:", error);
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      navigateFromNotificationData(navigate, action.notification.data);
    });

    await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      const data = notification.data as Record<string, unknown> | undefined;
      if (data?.path || data?.orderId) {
        navigateFromNotificationData(navigate, data);
      }
    });

    await PushNotifications.register();
  } catch (error) {
    console.warn("[staff-push] init skipped:", error);
    initStarted = false;
  }
}
