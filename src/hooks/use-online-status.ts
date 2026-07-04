import { useEffect, useState } from "react";
import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";

/**
 * Online status for UI banners. Defaults to online — `navigator.onLine` is unreliable
 * (especially Android WebView on LAN HTTP and some desktop browsers on localhost).
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (isNativeStaffApp()) return;

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (isNativeStaffApp()) return true;

  return online;
}
