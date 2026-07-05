import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import { AdminPinInput, isStaffPinComplete } from "@/components/admin-pin-input";
import { acceptAdminInvite, validateInviteToken } from "@/lib/api/invites.functions";
import { humanizeError } from "@/lib/errors";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { ADMIN_LOGIN_PATH } from "@/lib/admin-base-path";
import { supabase } from "@/integrations/supabase/client";
import { establishStaffPinSession } from "@/lib/staff-login";
import {
  clearStaffOnboardingOAuth,
  getGoogleOnboardingSession,
  loadStaffOnboardingOAuth,
  startStaffGoogleOnboarding,
} from "@/lib/staff-onboarding-oauth";
import { AdminAuthDivider, AdminGoogleAuthButton } from "./admin-google-auth-button";
import { AdminAuthLayout, ADMIN_AUTH_FIELD_CLASS } from "./admin-auth-layout";
import { AdminEmailVerifyStep } from "./admin-email-verify-step";
import { AdminOnboardingStepper } from "./admin-onboarding-stepper";
import { StaffInviteMobileGate } from "./staff-invite-mobile-gate";
import { StaffWelcomeChecklist } from "./go-live-checklist";
import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";
import { isAndroidMobileBrowser } from "@/lib/staff-invite-mobile";
import { savePendingStaffInviteToken } from "@/lib/staff-invite-pending";
import { completeStaffInviteOnboarding } from "@/components/staff-invite-resume-bridge";
import { cn } from "@/lib/utils";

const INVITE_STEPS = [
  { id: "account", label: "Account" },
  { id: "verify-email", label: "Verify email" },
  { id: "pin", label: "PIN" },
  { id: "welcome", label: "Welcome" },
] as const;

type InviteStepId = (typeof INVITE_STEPS)[number]["id"];

const accountSchema = z
  .object({
    email: z.string().trim().email("Enter a valid work email"),
    password: z.string().min(8, "Min 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type AccountForm = z.infer<typeof accountSchema>;

type AcceptInviteWizardProps = {
  token: string;
};

export function AcceptInviteWizard({ token }: AcceptInviteWizardProps) {
  const navigate = useNavigate();
  const [inviteRole, setInviteRole] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [validating, setValidating] = useState(true);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<InviteStepId>("account");
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [oauthUserId, setOauthUserId] = useState<string | null>(null);
  const [oauthEmail, setOauthEmail] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [joinedRole, setJoinedRole] = useState<string | null>(null);
  const [skipMobileGate, setSkipMobileGate] = useState(
    () => isNativeStaffApp() || !isAndroidMobileBrowser(),
  );

  const form = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const staffEmail = oauthEmail ?? form.watch("email");

  useEffect(() => {
    if (token) savePendingStaffInviteToken(token);
  }, [token]);

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setValidating(false);
      return;
    }
    validateInviteToken({ data: { token } })
      .then((r) => {
        if (!r.valid) {
          setInvalid(true);
          return;
        }
        setInviteRole(r.role);
      })
      .catch(() => setInvalid(true))
      .finally(() => setValidating(false));
  }, [token]);

  useEffect(() => {
    if (validating) return;
    void (async () => {
      const flow = loadStaffOnboardingOAuth();
      if (flow?.kind !== "invite" || flow.token !== token) return;

      const session = await getGoogleOnboardingSession();
      if (!session) return;

      setOauthUserId(session.userId);
      setOauthEmail(session.email);
      form.setValue("email", session.email);
      setStep("pin");
    })();
  }, [validating, token, form]);

  const stepIndex = INVITE_STEPS.findIndex((s) => s.id === step);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === INVITE_STEPS.length - 1;

  const acceptInvite = async () => {
    if (!staffEmail.trim()) return false;
    if (!oauthUserId && !emailVerificationToken) return false;
    const password = form.getValues("password");
    if (!isStaffPinComplete(pin)) {
      toast.error("PIN must be 5 digits.");
      return false;
    }
    if (pin !== confirmPin) {
      toast.error("PINs do not match.");
      return false;
    }

    setBusy(true);
    try {
      const result = await acceptAdminInvite({
        data: {
          token,
          email: oauthUserId ? undefined : staffEmail,
          password: oauthUserId ? undefined : password,
          emailVerificationToken: oauthUserId ? undefined : (emailVerificationToken ?? undefined),
          oauthUserId: oauthUserId ?? undefined,
          pin,
        },
      });
      if (!oauthUserId) {
        await establishStaffPinSession(staffEmail, pin);
      }
      clearStaffOnboardingOAuth();
      completeStaffInviteOnboarding();
      setJoinedRole(result.role);
      toast.success(`Welcome! You joined as ${result.role}.`);
      return true;
    } catch (e: unknown) {
      toast.error(humanizeError(e, { fallback: "Could not accept this invite." }));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const goNext = async () => {
    if (step === "account") {
      const valid = await form.trigger();
      if (!valid) return;
      setEmailVerificationToken(null);
      if (oauthUserId) {
        setStep("pin");
        return;
      }
      setStep("verify-email");
      return;
    }
    if (step === "verify-email") {
      if (!emailVerificationToken) {
        toast.error("Verify your email before continuing.");
        return;
      }
      setStep("pin");
      return;
    }
    if (step === "pin") {
      const ok = await acceptInvite();
      if (ok) setStep("welcome");
    }
  };

  const goBack = () => {
    const prev = INVITE_STEPS[stepIndex - 1];
    if (prev) setStep(prev.id);
  };

  const onGoogleInvite = async () => {
    setGoogleBusy(true);
    try {
      await startStaffGoogleOnboarding({ kind: "invite", token });
    } catch (e: unknown) {
      toast.error(humanizeError(e, { fallback: "Could not start Google sign-in." }));
      setGoogleBusy(false);
    }
  };

  if (invalid) {
    return (
      <AdminAuthLayout
        shopName="Kate Shop"
        title="Invalid invite"
        description="This link may be expired or already used."
      >
        <Button asChild className={`w-full ${adminPrimaryTouch}`}>
          <Link to={ADMIN_LOGIN_PATH}>Go to sign in</Link>
        </Button>
      </AdminAuthLayout>
    );
  }

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center type-body-sm text-muted-foreground">
        Validating invite…
      </div>
    );
  }

  if (!skipMobileGate) {
    return (
      <StaffInviteMobileGate
        token={token}
        inviteRole={inviteRole}
        onContinueInBrowser={() => setSkipMobileGate(true)}
      />
    );
  }

  return (
    <AdminAuthLayout
      shopName="Kate Shop"
      eyebrow="Staff invite"
      title="Join the team"
      description={
        <>
          One-time link · role:{" "}
          <span className="font-medium text-foreground">{inviteRole ?? "staff"}</span>
        </>
      }
      wide
    >
      <AdminOnboardingStepper steps={[...INVITE_STEPS]} current={step} />

      {step === "account" ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="invite-email">Work email</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled={Boolean(oauthUserId) || busy}
              className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
              {...form.register("email")}
            />
            <p className="mt-1 type-caption text-muted-foreground">
              Use the address you want for daily sign-in and recovery.
            </p>
            {form.formState.errors.email ? (
              <p className="mt-1 type-caption text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="invite-password">Choose password</Label>
            <PasswordInput
              id="invite-password"
              autoComplete="new-password"
              disabled={Boolean(oauthUserId)}
              {...form.register("password")}
              className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
            />
            <p className="mt-1 type-caption text-muted-foreground">
              Recovery credential — daily sign-in uses your PIN.
            </p>
            {form.formState.errors.password ? (
              <p className="mt-1 type-caption text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="invite-confirm">Confirm password</Label>
            <PasswordInput
              id="invite-confirm"
              autoComplete="new-password"
              disabled={Boolean(oauthUserId)}
              {...form.register("confirmPassword")}
              className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="mt-1 type-caption text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
          <AdminAuthDivider />
          <AdminGoogleAuthButton disabled={busy} busy={googleBusy} onClick={onGoogleInvite} />
        </div>
      ) : null}

      {step === "verify-email" ? (
        <AdminEmailVerifyStep
          email={staffEmail}
          purpose="invite_accept"
          inviteToken={token}
          disabled={busy}
          onVerified={(tokenValue) => {
            setEmailVerificationToken(tokenValue);
            setStep("pin");
          }}
        />
      ) : null}

      {step === "pin" ? (
        <div className="space-y-4">
          <p className="type-body-sm text-muted-foreground">
            Choose a 5-digit PIN for daily sign-in
            {staffEmail ? (
              <>
                {" "}
                as <span className="font-medium text-foreground">{staffEmail}</span>.
              </>
            ) : (
              "."
            )}
          </p>
          <div>
            <Label>Choose PIN</Label>
            <div className="mt-2 flex justify-center">
              <AdminPinInput value={pin} onChange={setPin} disabled={busy} />
            </div>
          </div>
          <div>
            <Label>Confirm PIN</Label>
            <div className="mt-2 flex justify-center">
              <AdminPinInput value={confirmPin} onChange={setConfirmPin} disabled={busy} />
            </div>
          </div>
        </div>
      ) : null}

      {step === "welcome" ? (
        <div className="space-y-4">
          <p className="type-body-sm text-muted-foreground">
            You are signed in as <strong>{joinedRole ?? inviteRole}</strong>. Here is where to
            start:
          </p>
          <StaffWelcomeChecklist role={joinedRole ?? inviteRole ?? "staff"} />
        </div>
      ) : null}

      <div className="mt-stack-lg flex flex-col gap-2 sm:flex-row sm:justify-between">
        {!isFirst && step !== "welcome" && step !== "verify-email" ? (
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={busy}
            className={adminPrimaryTouch}
          >
            Back
          </Button>
        ) : (
          <span />
        )}
        {isLast ? (
          <Button
            type="button"
            onClick={() => navigate({ to: "/admin" })}
            className={`${adminPrimaryTouch} sm:ml-auto`}
          >
            Enter admin
          </Button>
        ) : step === "verify-email" ? (
          <span className="sm:ml-auto" />
        ) : (
          <Button
            type="button"
            onClick={() => void goNext()}
            disabled={busy}
            className={`${adminPrimaryTouch} sm:ml-auto`}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Joining…
              </>
            ) : step === "pin" ? (
              "Join team"
            ) : (
              "Continue"
            )}
          </Button>
        )}
      </div>
    </AdminAuthLayout>
  );
}
