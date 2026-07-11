import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { StaffInviteMobileGate } from "@/components/admin/onboarding/staff-invite-mobile-gate";
import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";
import { probeStaffAppForInvite, openStaffInviteInApp } from "@/lib/staff-invite-app-detect";
import { isAndroidMobileBrowser } from "@/lib/staff-invite-mobile";
import { ADMIN_INSTALL_PATH, ADMIN_SIGNUP_PATH } from "@/lib/admin-base-path";
import { savePendingStaffInviteToken } from "@/lib/staff-invite-pending";
import { isStaffInviteFlowEnabled } from "@/lib/staff-onboarding-mode";
import { Button } from "@/components/ui/button";
import { adminPrimaryTouch } from "@/lib/admin-mobile";

type AcceptInviteRedirectProps = {
  token: string;
  skipAppProbe?: boolean;
};

type InviteRedirectPhase = "checking" | "probing" | "opened" | "install" | "signup";

function resolveClientPhase(token: string, skipAppProbe: boolean): InviteRedirectPhase {
  // Hibernated invite flow: Android → install gate, otherwise → signup.
  if (!isStaffInviteFlowEnabled()) {
    if (isNativeStaffApp()) return "signup";
    if (isAndroidMobileBrowser()) return "install";
    return "signup";
  }

  if (!token) return "signup";
  if (isNativeStaffApp() || !isAndroidMobileBrowser()) return "signup";
  if (skipAppProbe) return "install";
  return "probing";
}

function InviteBusyMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 type-body-sm text-muted-foreground">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <p>{message}</p>
    </div>
  );
}

/**
 * Invite entry — full probe/install flow when invites are enabled.
 * When hibernated: install gate (Android) or signup only; invite token is ignored.
 */
export function AcceptInviteRedirect({ token, skipAppProbe = false }: AcceptInviteRedirectProps) {
  const navigate = useNavigate();
  const inviteFlow = isStaffInviteFlowEnabled();
  const [phase, setPhase] = useState<InviteRedirectPhase>("checking");

  useEffect(() => {
    if (inviteFlow && token) savePendingStaffInviteToken(token);
  }, [inviteFlow, token]);

  useEffect(() => {
    setPhase(resolveClientPhase(token, skipAppProbe));
  }, [token, skipAppProbe]);

  useEffect(() => {
    if (phase !== "signup") return;
    navigate({ to: ADMIN_SIGNUP_PATH, replace: true });
  }, [phase, navigate]);

  useEffect(() => {
    if (!inviteFlow || phase !== "probing" || !token) return;

    let cancelled = false;
    void probeStaffAppForInvite(token).then((result) => {
      if (cancelled) return;
      setPhase(result === "opened" ? "opened" : "install");
    });

    return () => {
      cancelled = true;
    };
  }, [inviteFlow, phase, token]);

  if (phase === "checking" || phase === "probing") {
    return (
      <InviteBusyMessage
        message={phase === "checking" ? "Preparing your invite…" : "Opening Kate Admin…"}
      />
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
    if (!inviteFlow) {
      return (
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
          <div className="rounded-2xl border bg-card p-6 text-center shadow-elevated">
            <h1 className="font-heading text-xl font-semibold text-foreground">
              Install Kate Admin
            </h1>
            <p className="mt-2 type-body-sm text-muted-foreground">
              Download the app, then create your account with email and PIN.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button asChild className={adminPrimaryTouch}>
                <a href={ADMIN_INSTALL_PATH}>
                  <Download className="size-4" aria-hidden />
                  Download Kate Admin
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link to={ADMIN_SIGNUP_PATH}>Continue to sign up</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <StaffInviteMobileGate
        token={token}
        inviteRole={null}
        onContinueInBrowser={() => setPhase("signup")}
      />
    );
  }

  return <InviteBusyMessage message="Preparing signup…" />;
}
