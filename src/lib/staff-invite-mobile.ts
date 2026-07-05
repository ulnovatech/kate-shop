import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";

/** Android phone browser — not the installed Kate Admin APK. */
export function isAndroidMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent) && !isNativeStaffApp();
}
