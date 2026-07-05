import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { getBootstrapStatus } from "@/lib/api/bootstrap.functions";
import { validateInviteToken } from "@/lib/api/invites.functions";
import { defaultAdminPath } from "@/lib/rbac";
import {
  ADMIN_ACCEPT_INVITE_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_SETUP_PATH,
} from "@/lib/admin-base-path";
import { withTimeout } from "@/lib/with-timeout";
import { parseStaffInviteInput } from "@/lib/staff-invite-input";
import { savePendingStaffInviteToken } from "@/lib/staff-invite-pending";
import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";
import { humanizeError } from "@/lib/errors";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { cn } from "@/lib/utils";
import { AuthCardSkeleton } from "@/components/loading-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminShopName } from "@/components/admin-brand-mark";
import { AdminAuthLayout, ADMIN_AUTH_FIELD_CLASS } from "./admin-auth-layout";

const BOOTSTRAP_TIMEOUT_MS = 6_000;

export function StaffJoinPage() {
  const shopName = useAdminShopName();
  const navigate = useNavigate();
  const { user, isAdmin, loading, staffRole } = useAuth();
  const [ready, setReady] = useState(false);
  const [bootstrapRequired, setBootstrapRequired] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    withTimeout(getBootstrapStatus(), BOOTSTRAP_TIMEOUT_MS, "Setup check")
      .then((s) => setBootstrapRequired(s.required))
      .catch(() => {
        // Non-blocking — join flow still works when bootstrap check fails.
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate({ to: defaultAdminPath(staffRole), replace: true });
    }
  }, [user, isAdmin, staffRole, loading, navigate]);

  const continueWithToken = useCallback(
    async (token: string) => {
      setBusy(true);
      setFieldError(null);
      try {
        const result = await validateInviteToken({ data: { token } });
        if (!result.valid) {
          setFieldError(
            "This invite link is expired or already used. Ask your shop owner for a new one.",
          );
          return;
        }
        savePendingStaffInviteToken(token);
        navigate({
          to: ADMIN_ACCEPT_INVITE_PATH,
          search: { token },
          replace: true,
        });
      } catch (error) {
        toast.error(
          humanizeError(error, { fallback: "Could not validate invite link. Try again." }),
        );
      } finally {
        setBusy(false);
      }
    },
    [navigate],
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const token = parseStaffInviteInput(inviteInput);
    if (!token) {
      setFieldError("Paste your full invite link or token from your shop owner.");
      return;
    }
    void continueWithToken(token);
  };

  const pasteFromClipboard = async () => {
    if (!navigator.clipboard?.readText) {
      toast.error("Paste your invite link into the field above.");
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast.error("Clipboard is empty.");
        return;
      }
      setInviteInput(text.trim());
      setFieldError(null);
    } catch {
      toast.error("Could not read clipboard. Paste manually.");
    }
  };

  if (!ready) {
    return <AuthCardSkeleton />;
  }

  return (
    <AdminAuthLayout
      shopName={shopName}
      title="Join your team"
      description="Create your staff account with the invite link from your shop owner."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="invite-link">Invite link</Label>
          <Input
            id="invite-link"
            type="text"
            inputMode="url"
            autoComplete="off"
            placeholder="https://…/accept-invite?token=…"
            value={inviteInput}
            onChange={(e) => {
              setInviteInput(e.target.value);
              setFieldError(null);
            }}
            disabled={busy}
            className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
          />
          <p className="mt-1 type-caption text-muted-foreground">
            Ask your shop owner for an invite link on WhatsApp or email.
          </p>
          {fieldError ? (
            <p className="mt-1 type-caption text-destructive" role="alert">
              {fieldError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={busy} className={`w-full ${adminPrimaryTouch}`}>
            {busy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Checking invite…
              </>
            ) : (
              "Continue to signup"
            )}
          </Button>
          {typeof navigator !== "undefined" && navigator.clipboard?.readText ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              className={adminPrimaryTouch}
              onClick={() => void pasteFromClipboard()}
            >
              Paste from clipboard
            </Button>
          ) : null}
        </div>
      </form>

      <p className="mt-stack type-caption text-muted-foreground">
        Already have an account?{" "}
        <Link to={ADMIN_LOGIN_PATH} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>

      {bootstrapRequired && !isNativeStaffApp() ? (
        <p className="mt-2 type-caption text-muted-foreground">
          Setting up a new shop?{" "}
          <Link to={ADMIN_SETUP_PATH} className="font-medium text-primary hover:underline">
            Run shop setup
          </Link>
        </p>
      ) : null}
    </AdminAuthLayout>
  );
}
