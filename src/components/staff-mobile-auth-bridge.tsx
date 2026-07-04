import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  completeStaffAuthFromUrl,
  isNativeStaffApp,
  isStaffAuthCallbackUrl,
} from "@/integrations/supabase/staff-mobile-auth";
import { handleStaffDeepLink } from "@/lib/staff-deep-link";
import { humanizeError } from "@/lib/errors";

/**
 * Handles Supabase auth callbacks and order deep links in the Kate Admin APK (C8 + C12).
 * Web `/login-callback` is handled by the dedicated route; this covers cold-start deep links.
 */
export function StaffMobileAuthBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    let removeListener: (() => void) | undefined;

    const finishAuth = (session: boolean, error: Error | null) => {
      if (cancelled) return;
      if (error) {
        toast.error(humanizeError(error, { fallback: "Could not complete sign-in." }));
        navigate({ to: "/login", replace: true });
        return;
      }
      if (session) {
        navigate({ to: "/", replace: true });
      }
    };

    const handleUrl = async (url: string) => {
      try {
        if (isStaffAuthCallbackUrl(url)) {
          const { session, error } = await completeStaffAuthFromUrl(url);
          finishAuth(Boolean(session), error);
          return;
        }

        await handleStaffDeepLink(url, (opts) => navigate(opts));
      } catch (error) {
        console.warn("[staff-mobile] deep link handling failed:", error);
      }
    };

    async function setup() {
      if (!isNativeStaffApp()) return;

      try {
        const { App } = await import("@capacitor/app");
        const launch = await App.getLaunchUrl();
        if (launch?.url) await handleUrl(launch.url);

        const handle = await App.addListener("appUrlOpen", (event) => {
          void handleUrl(event.url);
        });
        removeListener = () => void handle.remove();
      } catch (error) {
        console.warn("[staff-mobile] app URL bridge failed:", error);
      }
    }

    void setup();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [navigate]);

  return null;
}
