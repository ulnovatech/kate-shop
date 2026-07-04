import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";
import { initStaffPush, isStaffPushNativeEnabled } from "@/lib/staff-push";

/** Registers FCM when VITE_STAFF_PUSH_NATIVE=true and google-services.json is configured. */
export function StaffPushRegistration() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativeStaffApp() || !isStaffPushNativeEnabled()) return;
    void initStaffPush((opts) => navigate(opts)).catch((error) => {
      console.warn("[staff-push] setup failed:", error);
    });
  }, [navigate]);

  return null;
}
