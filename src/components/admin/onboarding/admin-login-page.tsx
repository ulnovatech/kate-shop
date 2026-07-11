import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { getBootstrapStatus } from "@/lib/api/bootstrap.functions";
import { defaultAdminPath } from "@/lib/rbac";
import { ADMIN_JOIN_PATH, ADMIN_SETUP_PATH } from "@/lib/admin-base-path";
import { isStaffInviteFlowEnabled } from "@/lib/staff-onboarding-mode";
import { withTimeout } from "@/lib/with-timeout";
import { signInWithStaffPinAndFinish } from "@/lib/staff-login";
import { AuthCardSkeleton } from "@/components/loading-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPinInput } from "@/components/admin-pin-input";
import { StaffForgotPinFlow } from "@/components/staff-forgot-pin-flow";
import { useAdminShopName } from "@/components/admin-brand-mark";
import {
  humanizeError,
  isDevServerUnreachableError,
  isSupabaseUnreachableError,
  supabaseUnreachableMessage,
} from "@/lib/errors";
import { staffDevServerUnreachableMessage } from "@/lib/staff-pwa";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { cn } from "@/lib/utils";
import { AdminAuthLayout, ADMIN_AUTH_FIELD_CLASS } from "./admin-auth-layout";

const BOOTSTRAP_TIMEOUT_MS = 6_000;

type LoginView = "sign-in" | "forgot-pin";

export function AdminLoginPage() {
  const shopName = useAdminShopName();
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [bootstrapRequired, setBootstrapRequired] = useState(false);
  const [view, setView] = useState<LoginView>("sign-in");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const { user, isAdmin, loading, staffRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    withTimeout(getBootstrapStatus(), BOOTSTRAP_TIMEOUT_MS, "Setup check")
      .then((s) => {
        setBootstrapRequired(s.required);
        if (s.required) {
          navigate({ to: ADMIN_SETUP_PATH, replace: true });
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : typeof err === "string" ? err : "";
        if (message.includes("Missing Supabase environment variable")) {
          toast.error(
            "Server .env is missing Supabase keys. Add SUPABASE_SERVICE_ROLE_KEY, restart the dev server, then refresh.",
          );
          return;
        }
        toast.error(
          isDevServerUnreachableError(err)
            ? staffDevServerUnreachableMessage()
            : isSupabaseUnreachableError(err)
              ? supabaseUnreachableMessage()
              : "Could not verify setup status. You can still try signing in.",
        );
      })
      .finally(() => setReady(true));
  }, [navigate]);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate({ to: defaultAdminPath(staffRole), replace: true });
    }
  }, [user, isAdmin, staffRole, loading, navigate]);

  const attemptSignIn = useCallback(
    async (pinValue: string) => {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !z.string().email().safeParse(trimmedEmail).success) {
        toast.error("Enter your email first.");
        setPin("");
        return;
      }
      if (busy) return;

      setBusy(true);
      try {
        await signInWithStaffPinAndFinish(trimmedEmail, pinValue, navigate);
      } catch (e: unknown) {
        toast.error(humanizeError(e, { fallback: "Could not sign in. Check your email and PIN." }));
        setPin("");
      } finally {
        setBusy(false);
      }
    },
    [busy, email, navigate],
  );

  const onSignInSubmit = (event: FormEvent) => {
    event.preventDefault();
    void attemptSignIn(pin);
  };

  if (!ready) {
    return <AuthCardSkeleton />;
  }

  return (
    <AdminAuthLayout
      shopName={shopName}
      title={view === "sign-in" ? "Sign in" : "Reset PIN"}
      description={
        view === "sign-in"
          ? "Staff sign-in with email and PIN."
          : "We will email you a verification code to set a new PIN."
      }
    >
      {view === "sign-in" ? (
        <form onSubmit={onSignInSubmit} className="space-y-4">
          <div>
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
              autoComplete="username"
            />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="login-pin">PIN</Label>
              <button
                type="button"
                onClick={() => setView("forgot-pin")}
                className="type-caption font-medium text-primary hover:underline shrink-0"
              >
                Forgot or change PIN?
              </button>
            </div>
            <div className="mt-2 flex justify-center">
              <AdminPinInput
                id="login-pin"
                value={pin}
                onChange={setPin}
                disabled={busy}
                onComplete={(value) => void attemptSignIn(value)}
              />
            </div>
            <p className="mt-1 text-center type-caption text-muted-foreground">5 digits</p>
            {busy ? (
              <p className="mt-2 flex items-center justify-center gap-2 type-caption text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Signing in…
              </p>
            ) : null}
          </div>
          <Button type="submit" disabled={busy} className={`w-full ${adminPrimaryTouch}`}>
            Sign in
          </Button>
        </form>
      ) : (
        <StaffForgotPinFlow
          email={email}
          onEmailChange={setEmail}
          emailEditable
          onSuccess={() => {
            setPin("");
            setView("sign-in");
          }}
          onCancel={() => setView("sign-in")}
          cancelLabel="Back to sign in"
          fieldClassName={ADMIN_AUTH_FIELD_CLASS}
        />
      )}

      {view === "sign-in" ? (
        <p className="mt-stack type-caption text-muted-foreground">
          New team member?{" "}
          <Link to={ADMIN_JOIN_PATH} className="font-medium text-primary hover:underline">
            {isStaffInviteFlowEnabled() ? "Join with invite link" : "Install app & sign up"}
          </Link>
          {bootstrapRequired ? (
            <>
              {" "}
              ·{" "}
              <Link to={ADMIN_SETUP_PATH} className="font-medium text-primary hover:underline">
                Run shop setup
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </AdminAuthLayout>
  );
}
