import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";
import { staffOfflineBannerMessage } from "@/lib/staff-pwa";

async function verifyStaffServerReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${window.location.origin}/health.json`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Online-only banner for Kate Admin (C9).
 * Shown only after a failed health check — not from `navigator.onLine` alone.
 */
export function StaffOfflineBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isNativeStaffApp()) return;

    const onOnline = () => setShow(false);
    const onOffline = () => {
      void verifyStaffServerReachable().then((ok) => setShow(!ok));
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>{staffOfflineBannerMessage()}</span>
    </div>
  );
}
