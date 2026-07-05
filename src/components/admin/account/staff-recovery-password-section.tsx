import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { AdminEmailVerifyStep } from "@/components/admin/onboarding/admin-email-verify-step";
import {
  requestStaffAccountRecoveryPasswordOtp,
  updateStaffAccountRecoveryPassword,
} from "@/lib/api/staff-account.functions";
import { humanizeError } from "@/lib/errors";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { ADMIN_AUTH_FIELD_CLASS } from "@/components/admin/onboarding/admin-auth-layout";
import { cn } from "@/lib/utils";

type StaffRecoveryPasswordSectionProps = {
  currentEmail: string;
};

export function StaffRecoveryPasswordSection({ currentEmail }: StaffRecoveryPasswordSectionProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const savePassword = useMutation({
    mutationFn: async () => {
      if (!verificationToken) throw new Error("Verify your email first.");
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      if (password !== confirmPassword) throw new Error("Passwords do not match.");
      return updateStaffAccountRecoveryPassword({
        data: { verificationToken, password },
      });
    },
    onSuccess: () => {
      toast.success("Recovery password updated.");
      setPassword("");
      setConfirmPassword("");
      setVerificationToken(null);
    },
    onError: (e: unknown) =>
      toast.error(humanizeError(e, { fallback: "Could not update password." })),
  });

  const passwordsMatch = password.length >= 8 && password === confirmPassword;

  return (
    <div className="space-y-4">
      <p className="type-body-sm text-muted-foreground">
        Daily sign-in uses your PIN. A recovery password is stored securely for account recovery.
        Set or change it here after verifying{" "}
        <span className="font-medium text-foreground">{currentEmail}</span>.
      </p>

      {!verificationToken ? (
        <AdminEmailVerifyStep
          email={currentEmail}
          purpose="change_password"
          disabled={savePassword.isPending}
          requestOtp={() => requestStaffAccountRecoveryPasswordOtp().then(() => undefined)}
          onVerified={setVerificationToken}
        />
      ) : (
        <>
          <div>
            <Label htmlFor="account-recovery-password">New recovery password</Label>
            <PasswordInput
              id="account-recovery-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={savePassword.isPending}
              className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
            />
            <p className="mt-1 type-caption text-muted-foreground">At least 8 characters</p>
          </div>
          <div>
            <Label htmlFor="account-recovery-password-confirm">Confirm password</Label>
            <PasswordInput
              id="account-recovery-password-confirm"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={savePassword.isPending}
              className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={savePassword.isPending || !passwordsMatch}
              className={adminPrimaryTouch}
              onClick={() => void savePassword.mutate()}
            >
              {savePassword.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Save recovery password"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={savePassword.isPending}
              onClick={() => {
                setVerificationToken(null);
                setPassword("");
                setConfirmPassword("");
              }}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
