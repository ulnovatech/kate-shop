import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";
import { ADMIN_SIGNUP_PATH } from "@/lib/admin-base-path";
import {
  clearPendingStaffInviteToken,
  loadPendingStaffInviteToken,
  parseInviteTokenFromLocation,
  savePendingStaffInviteToken,
} from "@/lib/staff-invite-pending";

/**
 * Resumes staff invite after APK install (shared localStorage on admin origin).
 * Also persists token from deep links / accept-invite URL on native launch.
 */
export function StaffInviteResumeBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlToken = parseInviteTokenFromLocation();
    if (urlToken) {
      savePendingStaffInviteToken(urlToken);
    }

    if (!isNativeStaffApp()) return;

    const pending = loadPendingStaffInviteToken();
    if (!pending) return;

    const onInviteFlow =
      typeof window !== "undefined" &&
      (window.location.pathname.includes("accept-invite") ||
        window.location.pathname.includes("signup"));
    if (onInviteFlow) return;

    navigate({
      to: ADMIN_SIGNUP_PATH,
      replace: true,
    });
  }, [navigate]);

  return null;
}

/** Call after invite is accepted successfully. */
export function completeStaffInviteOnboarding(): void {
  clearPendingStaffInviteToken();
}
