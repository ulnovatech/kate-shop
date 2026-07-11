import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  acceptAdminInvite,
  registerStaffAccount,
  validateInviteToken,
} from "@/lib/api/invites.functions";
import { defaultAdminPath } from "@/lib/rbac";
import { ADMIN_INSTALL_PATH, ADMIN_LOGIN_PATH } from "@/lib/admin-base-path";
import { loadPendingStaffInviteToken } from "@/lib/staff-invite-pending";
import { completeStaffInviteOnboarding } from "@/components/staff-invite-resume-bridge";
import { humanizeError } from "@/lib/errors";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { establishStaffPinSession, finishStaffSignIn } from "@/lib/staff-login";
import {
  clearStaffOnboardingOAuth,
  startStaffGoogleOnboarding,
  tryResumeStaffGoogleInviteOnboarding,
} from "@/lib/staff-onboarding-oauth";
import { supabase } from "@/integrations/supabase/client";
import { AuthCardSkeleton } from "@/components/loading-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPinInput, isStaffPinComplete } from "@/components/admin-pin-input";
import { useAdminShopName } from "@/components/admin-brand-mark";
import { StaffGoogleSignInOption } from "./admin-google-auth-button";
import { AdminAuthLayout, ADMIN_AUTH_FIELD_CLASS } from "./admin-auth-layout";
import { AdminEmailVerifyStep } from "./admin-email-verify-step";
import { StaffWelcomeChecklist } from "./go-live-checklist";
import { isStaffGoogleAuthEnabled } from "@/lib/staff-google-auth-enabled";
import {
  isStaffInviteFlowEnabled,
  isStaffSignupEmailOtpRequired,
} from "@/lib/staff-onboarding-mode";
import { cn } from "@/lib/utils";

type SignupPhase = "loading" | "no_invite" | "invalid" | "form" | "welcome";
type FormStep = "details" | "verify-email";

export function StaffSignupPage() {
  const shopName = useAdminShopName();
  const navigate = useNavigate();
  const { user, isAdmin, loading, staffRole } = useAuth();
  const inviteFlow = isStaffInviteFlowEnabled();
  const otpRequired = inviteFlow && isStaffSignupEmailOtpRequired();
  const [phase, setPhase] = useState<SignupPhase>("loading");
  const [formStep, setFormStep] = useState<FormStep>("details");
  const [inviteRole, setInviteRole] = useState<string | null>(null);
  const [joinedRole, setJoinedRole] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [oauthUserId, setOauthUserId] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate({ to: defaultAdminPath(staffRole), replace: true });
    }
  }, [user, isAdmin, staffRole, loading, navigate]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!inviteFlow) {
        if (!cancelled) setPhase("form");
        return;
      }

      const token = loadPendingStaffInviteToken();
      if (!token) {
        if (!cancelled) setPhase("no_invite");
        return;
      }

      setInviteToken(token);

      const result = await validateInviteToken({ data: { token } });
      if (cancelled) return;

      if (!result.valid) {
        setPhase("invalid");
        return;
      }

      setInviteRole(result.role);
      setPhase("form");
    })().catch(() => {
      if (!cancelled) setPhase(inviteFlow ? "invalid" : "form");
    });

    return () => {
      cancelled = true;
    };
  }, [inviteFlow]);

  useEffect(() => {
    if (!inviteFlow || !isStaffGoogleAuthEnabled() || phase !== "form" || !inviteToken) return;

    let cancelled = false;

    const resumeGoogle = async () => {
      const session = await tryResumeStaffGoogleInviteOnboarding(inviteToken);
      if (cancelled || !session) return;
      setOauthUserId(session.userId);
      setEmail(session.email);
      setGoogleBusy(false);
      setFormStep("details");
    };

    void resumeGoogle();

    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      void resumeGoogle();
    });

    return () => {
      cancelled = true;
      authSub.subscription.unsubscribe();
    };
  }, [inviteFlow, phase, inviteToken]);

  const completeSimpleSignup = async () => {
    const trimmedEmail = email.trim();
    setBusy(true);
    try {
      const result = await registerStaffAccount({
        data: { email: trimmedEmail, pin },
      });
      await establishStaffPinSession(trimmedEmail, pin);
      clearStaffOnboardingOAuth();
      completeStaffInviteOnboarding();
      setJoinedRole(result.role);
      toast.success(`Welcome! You joined as ${result.role}.`);
      setPhase("welcome");
    } catch (error) {
      toast.error(humanizeError(error, { fallback: "Could not create your account." }));
    } finally {
      setBusy(false);
    }
  };

  const completeInviteSignup = async (verificationToken?: string | null) => {
    const token = inviteToken ?? loadPendingStaffInviteToken();
    if (!token) {
      toast.error("Open your invite link from your shop owner first.");
      return;
    }

    const trimmedEmail = email.trim();
    setBusy(true);
    try {
      const result = await acceptAdminInvite({
        data: {
          token,
          email: oauthUserId ? undefined : trimmedEmail,
          emailVerificationToken: oauthUserId
            ? undefined
            : otpRequired
              ? (verificationToken ?? emailVerificationToken ?? undefined)
              : undefined,
          oauthUserId: oauthUserId ?? undefined,
          pin,
        },
      });

      if (!oauthUserId) {
        await establishStaffPinSession(trimmedEmail, pin);
      }

      clearStaffOnboardingOAuth();
      completeStaffInviteOnboarding();
      setJoinedRole(result.role);
      toast.success(`Welcome! You joined as ${result.role}.`);
      setPhase("welcome");
    } catch (error) {
      toast.error(humanizeError(error, { fallback: "Could not create your account." }));
    } finally {
      setBusy(false);
    }
  };

  const onGoogleSignup = async () => {
    if (!inviteFlow) {
      toast.message("Google sign-in is paused. Use email and PIN.");
      return;
    }
    const token = inviteToken ?? loadPendingStaffInviteToken();
    if (!token) {
      toast.error("Open your invite link from your shop owner first.");
      return;
    }
    setGoogleBusy(true);
    try {
      await startStaffGoogleOnboarding({ kind: "invite", token });
    } catch (error) {
      toast.error(humanizeError(error, { fallback: "Could not start Google sign-in." }));
      setGoogleBusy(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!oauthUserId) {
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        toast.error("Enter a valid work email.");
        return;
      }
    }

    if (!isStaffPinComplete(pin)) {
      toast.error("PIN must be 5 digits.");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PINs do not match.");
      return;
    }

    if (!inviteFlow) {
      await completeSimpleSignup();
      return;
    }

    if (oauthUserId) {
      await completeInviteSignup();
      return;
    }

    if (otpRequired && !emailVerificationToken) {
      setFormStep("verify-email");
      return;
    }

    await completeInviteSignup(emailVerificationToken);
  };

  const enterAdmin = useCallback(() => {
    if (oauthUserId) {
      void finishStaffSignIn(navigate);
      return;
    }
    navigate({ to: defaultAdminPath(joinedRole ?? staffRole), replace: true });
  }, [navigate, joinedRole, staffRole, oauthUserId]);

  if (phase === "loading") {
    return <AuthCardSkeleton />;
  }

  if (phase === "no_invite") {
    return (
      <AdminAuthLayout
        shopName={shopName}
        title="Sign up for your new account"
        description="Open the invite link your shop owner sent you on this phone. It works once and walks you through signup."
      >
        <div className="space-y-4">
          <p className="type-body-sm text-muted-foreground">
            If you already installed the app, tap the invite link again in WhatsApp or email.
          </p>
          <Button asChild variant="default" className={`w-full ${adminPrimaryTouch}`}>
            <Link to={ADMIN_LOGIN_PATH}>Sign in</Link>
          </Button>
          <p className="text-center type-caption text-muted-foreground">
            <Link to={ADMIN_LOGIN_PATH} className="font-medium text-primary hover:underline">
              Forgot PIN?
            </Link>
          </p>
        </div>
      </AdminAuthLayout>
    );
  }

  if (phase === "invalid") {
    return (
      <AdminAuthLayout
        shopName={shopName}
        title="Invite unavailable"
        description="This invite was already used or has expired. Ask your shop owner for a new link."
      >
        <Button asChild variant="default" className={`w-full ${adminPrimaryTouch}`}>
          <Link to={ADMIN_LOGIN_PATH}>Sign in</Link>
        </Button>
      </AdminAuthLayout>
    );
  }

  if (phase === "welcome") {
    return (
      <AdminAuthLayout
        shopName={shopName}
        title="You're in"
        description={
          <>
            Signed up as{" "}
            <span className="font-medium text-foreground">
              {joinedRole ?? inviteRole ?? "staff"}
            </span>
            .
          </>
        }
        wide
      >
        <StaffWelcomeChecklist role={joinedRole ?? inviteRole ?? "staff"} />
        <Button
          type="button"
          className={`mt-stack-lg w-full ${adminPrimaryTouch}`}
          onClick={enterAdmin}
        >
          Enter admin
        </Button>
      </AdminAuthLayout>
    );
  }

  if (formStep === "verify-email" && otpRequired) {
    const token = inviteToken ?? loadPendingStaffInviteToken();
    return (
      <AdminAuthLayout
        shopName={shopName}
        title="Verify your email"
        description="Confirm you own this address before we create your account."
      >
        <AdminEmailVerifyStep
          email={email.trim()}
          purpose="invite_accept"
          inviteToken={token ?? undefined}
          disabled={busy}
          onVerified={(tokenValue) => {
            setEmailVerificationToken(tokenValue);
            void completeInviteSignup(tokenValue);
          }}
        />
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          className="mt-4 w-full"
          onClick={() => setFormStep("details")}
        >
          Back
        </Button>
      </AdminAuthLayout>
    );
  }

  return (
    <AdminAuthLayout
      shopName={shopName}
      title="Sign up for your new account"
      description={
        inviteRole ? (
          <>
            Role: <span className="font-medium text-foreground">{inviteRole}</span>
          </>
        ) : (
          "Create your staff account with email and a 5-digit PIN."
        )
      }
    >
      {!inviteFlow ? (
        <p className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 type-caption text-muted-foreground">
          Install Kate Admin if you haven&apos;t, then create your account here.{" "}
          <a href={ADMIN_INSTALL_PATH} className="font-medium text-primary hover:underline">
            Get the app
          </a>
        </p>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <div>
          <Label htmlFor="signup-email">Work email</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={Boolean(oauthUserId) || busy}
            className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
          />
          <p className="mt-1 type-caption text-muted-foreground">
            {oauthUserId
              ? "Signed in with Google. Set your daily PIN below."
              : "Use the address you want for daily sign-in."}
          </p>
        </div>

        <div>
          <Label htmlFor="signup-pin">Create PIN</Label>
          <div className="mt-2 flex justify-center">
            <AdminPinInput id="signup-pin" value={pin} onChange={setPin} disabled={busy} />
          </div>
          <p className="mt-1 text-center type-caption text-muted-foreground">
            5 digits for daily sign-in
          </p>
        </div>

        <div>
          <Label htmlFor="signup-pin-confirm">Confirm PIN</Label>
          <div className="mt-2 flex justify-center">
            <AdminPinInput
              id="signup-pin-confirm"
              value={confirmPin}
              onChange={setConfirmPin}
              disabled={busy}
            />
          </div>
        </div>

        <Button type="submit" disabled={busy} className={`w-full ${adminPrimaryTouch}`}>
          {busy ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Creating account…
            </>
          ) : !inviteFlow || oauthUserId || !otpRequired ? (
            "Create account"
          ) : (
            "Continue"
          )}
        </Button>

        {inviteFlow && !oauthUserId ? (
          <StaffGoogleSignInOption
            disabled={busy}
            busy={googleBusy}
            onClick={() => void onGoogleSignup()}
          />
        ) : null}
      </form>

      <p className="mt-stack type-caption text-muted-foreground">
        Already have an account?{" "}
        <Link to={ADMIN_LOGIN_PATH} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-2 type-caption text-muted-foreground">
        <Link to={ADMIN_LOGIN_PATH} className="font-medium text-primary hover:underline">
          Forgot PIN?
        </Link>
      </p>
    </AdminAuthLayout>
  );
}
