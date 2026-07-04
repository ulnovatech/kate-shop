import { useEffect } from "react";
import { evictShopPwaFromStaffOrigin, shouldEvictShopServiceWorker } from "@/lib/staff-pwa";
import { clearDeferredInstallPrompt } from "@/lib/pwa-install";
import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";

/**
 * Kate Admin network policy (C9):
 * - No shop Workbox registration on the dedicated staff origin
 * - Evict any shop SW + caches left from a prior visit
 * - Never capture storefront install prompts
 */
export function StaffPwaPolicy() {
  useEffect(() => {
    // APK loads remote admin URL — no shop service worker to evict; clearing caches can break HMR.
    if (isNativeStaffApp()) return;
    if (!shouldEvictShopServiceWorker()) return;

    clearDeferredInstallPrompt();
    void evictShopPwaFromStaffOrigin();
  }, []);

  return null;
}
