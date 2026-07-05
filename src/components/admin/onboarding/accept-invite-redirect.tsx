import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { StaffInviteMobileGate } from "@/components/admin/onboarding/staff-invite-mobile-gate";
import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";
import { isAndroidMobileBrowser } from "@/lib/staff-invite-mobile";
import { ADMIN_SIGNUP_PATH } from "@/lib/admin-base-path";
import { savePendingStaffInviteToken } from "@/lib/staff-invite-pending";

type AcceptInviteRedirectProps = {
  token: string;
};

/** Saves invite token silently and routes to signup (mobile gate on Android browser). */
export function AcceptInviteRedirect({ token }: AcceptInviteRedirectProps) {
  const navigate = useNavigate();
  const [skipMobileGate, setSkipMobileGate] = useState(
    () => isNativeStaffApp() || !isAndroidMobileBrowser(),
  );

  useEffect(() => {
    if (token) savePendingStaffInviteToken(token);
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate({ to: ADMIN_SIGNUP_PATH, replace: true });
      return;
    }
    if (!skipMobileGate) return;
    navigate({ to: ADMIN_SIGNUP_PATH, replace: true });
  }, [token, skipMobileGate, navigate]);

  if (!token) {
    return null;
  }

  if (!skipMobileGate) {
    return (
      <StaffInviteMobileGate
        token={token}
        inviteRole={null}
        onContinueInBrowser={() => setSkipMobileGate(true)}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center type-body-sm text-muted-foreground">
      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
      Preparing signup…
    </div>
  );
}
