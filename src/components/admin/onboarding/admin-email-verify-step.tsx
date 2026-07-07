import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AdminEmailOtpInput, isStaffEmailOtpComplete } from "@/components/admin-email-otp-input";
import {
  getStaffEmailOtpDeliveryStatus,
  requestStaffEmailOtp,
  verifyStaffEmailOtp,
} from "@/lib/api/staff-email-otp.functions";
import { humanizeError } from "@/lib/errors";
import { adminPrimaryTouch } from "@/lib/admin-mobile";

type StaffEmailVerifyPurpose =
  | "signup"
  | "invite_accept"
  | "forgot_pin"
  | "change_email"
  | "change_password";

type AdminEmailVerifyStepProps = {
  email: string;
  purpose: StaffEmailVerifyPurpose;
  inviteToken?: string;
  disabled?: boolean;
  /** Override OTP request (e.g. authenticated email change). */
  requestOtp?: () => Promise<void>;
  onVerified: (verificationToken: string) => void;
};

export function AdminEmailVerifyStep({
  email,
  purpose,
  inviteToken,
  disabled = false,
  requestOtp,
  onVerified,
}: AdminEmailVerifyStepProps) {
  const [busy, setBusy] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"gmail" | "console" | "none" | null>(null);

  useEffect(() => {
    void getStaffEmailOtpDeliveryStatus()
      .then((status) => setDeliveryMode(status.mode))
      .catch(() => setDeliveryMode(null));
  }, []);

  const sendCode = async () => {
    setBusy(true);
    try {
      if (requestOtp) {
        await requestOtp();
      } else {
        await requestStaffEmailOtp({
          data: {
            email,
            purpose,
            ...(inviteToken ? { inviteToken } : {}),
          },
        });
      }
      setCodeSent(true);
      toast.success("Verification code sent to your email.");
    } catch (e: unknown) {
      toast.error(humanizeError(e, { fallback: "Could not send verification email." }));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (codeValue: string = code) => {
    if (!isStaffEmailOtpComplete(codeValue)) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }

    setBusy(true);
    try {
      const result = await verifyStaffEmailOtp({
        data: { email, purpose, code: codeValue },
      });
      onVerified(result.verificationToken);
      toast.success("Email verified.");
    } catch (e: unknown) {
      toast.error(humanizeError(e, { fallback: "Could not verify code." }));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const isDisabled = disabled || busy;

  return (
    <div className="space-y-4">
      <p className="type-body-sm text-muted-foreground">
        We will send a 6-digit code to <span className="font-medium text-foreground">{email}</span>{" "}
        to confirm you own this address.
      </p>

      {deliveryMode === "none" ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 type-caption text-destructive">
          Email verification is not configured on the server. Ask your administrator to set{" "}
          <span className="font-medium">EMAIL_OTP_PROVIDER=gmail</span> or{" "}
          <span className="font-medium">EMAIL_OTP_PROVIDER=console</span> for local development.
        </p>
      ) : null}

      {deliveryMode === "console" ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 type-caption text-muted-foreground">
          Development mode: the verification code is printed in the server console after you tap
          send.
        </p>
      ) : null}

      {!codeSent ? (
        <Button
          type="button"
          disabled={isDisabled}
          onClick={() => void sendCode()}
          className={`w-full ${adminPrimaryTouch}`}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Sending…
            </>
          ) : (
            "Send verification code"
          )}
        </Button>
      ) : (
        <>
          <div>
            <Label htmlFor={`verify-email-${purpose}`}>Verification code</Label>
            <div className="mt-2 flex justify-center">
              <AdminEmailOtpInput
                id={`verify-email-${purpose}`}
                value={code}
                onChange={setCode}
                disabled={isDisabled}
                onComplete={(codeValue) => void verifyCode(codeValue)}
              />
            </div>
          </div>
          {busy ? (
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Verifying…
            </p>
          ) : (
            <Button
              type="button"
              disabled={isDisabled}
              onClick={() => void verifyCode()}
              className={`w-full ${adminPrimaryTouch}`}
            >
              Verify email
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={isDisabled}
            onClick={() => void sendCode()}
            className="w-full"
          >
            Resend code
          </Button>
        </>
      )}
    </div>
  );
}
