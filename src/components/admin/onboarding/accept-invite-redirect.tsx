import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { StaffInviteMobileGate } from "@/components/admin/onboarding/staff-invite-mobile-gate";
import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";
import { probeStaffAppForInvite, openStaffInviteInApp } from "@/lib/staff-invite-app-detect";
import { isAndroidMobileBrowser } from "@/lib/staff-invite-mobile";
import { ADMIN_SIGNUP_PATH } from "@/lib/admin-base-path";
import { savePendingStaffInviteToken } from "@/lib/staff-invite-pending";
import { Button } from "@/components/ui/button";
import { adminPrimaryTouch } from "@/lib/admin-mobile";

type AcceptInviteRedirectProps = {
  token: string;
};

type InviteRedirectPhase = "probing" | "opened" | "install" | "signup";

function resolveInitialPhase(token: string): InviteRedirectPhase {
  if (!token) return "signup";
  if (isNativeStaffApp() || !isAndroidMobileBrowser()) return "signup";
  return "probing";
}

/** Saves invite token, probes for installed APK on Android, then install gate or signup. */
export function AcceptInviteRedirect({ token }: AcceptInviteRedirectProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<InviteRedirectPhase>(() => resolveInitialPhase(token));

  useEffect(() => {
    if (token) savePendingStaffInviteToken(token);
  }, [token]);

  useEffect(() => {
    if (phase !== "signup") return;
    navigate({ to: ADMIN_SIGNUP_PATH, replace: true });
  }, [phase, navigate]);

  useEffect(() => {
    if (phase !== "probing" || !token) return;

    let cancelled = false;
    void probeStaffAppForInvite(token).then((result) => {
      if (cancelled) return;
      setPhase(result === "opened" ? "opened" : "install");
    });

    return () => {
      cancelled = true;
    };
  }, [phase, token]);

  if (!token) {
    return null;
  }

  if (phase === "probing") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 type-body-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        <p>Opening Kate Admin…</p>
      </div>
    );
  }

  if (phase === "opened") {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
        <div className="rounded-2xl border bg-card p-6 text-center shadow-elevated">
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Continuing in Kate Admin
          </h1>
          <p className="mt-2 type-body-sm text-muted-foreground">
            Finish signup in the app. If nothing happened, use one of the options below.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              type="button"
              className={adminPrimaryTouch}
              onClick={() => openStaffInviteInApp(token)}
            >
              <ExternalLink className="size-4" aria-hidden />
              Open Kate Admin
            </Button>
            <Button type="button" variant="outline" onClick={() => setPhase("install")}>
              <Download className="size-4" aria-hidden />
              Download app
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPhase("signup")}>
              Continue in browser instead
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "install") {
    return (
      <StaffInviteMobileGate
        token={token}
        inviteRole={null}
        onContinueInBrowser={() => setPhase("signup")}
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
