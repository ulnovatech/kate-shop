import { useCallback, useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPinInput, isStaffPinComplete } from "@/components/admin-pin-input";
import { AdminEmailOtpInput, isStaffEmailOtpComplete } from "@/components/admin-email-otp-input";
import { resetStaffPinWithEmailVerification } from "@/lib/api/auth.functions";
import { requestStaffEmailOtp, verifyStaffEmailOtp } from "@/lib/api/staff-email-otp.functions";
import { humanizeError } from "@/lib/errors";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { cn } from "@/lib/utils";

type ForgotPinStep = "request" | "verify" | "reset";

export type StaffForgotPinFlowProps = {
  email: string;
  onEmailChange?: (email: string) => void;
  emailEditable?: boolean;
  /** Send the verification email as soon as the flow mounts (when email is known). */
  autoSendCode?: boolean;
  onSuccess?: (newPin: string) => void;
  onCancel?: () => void;
  cancelLabel?: string;
  fieldClassName?: string;
  pinSlotClassName?: string;
  mutedTextClassName?: string;
};

export function StaffForgotPinFlow({
  email,
  onEmailChange,
  emailEditable = false,
  autoSendCode = false,
  onSuccess,
  onCancel,
  cancelLabel = "Back",
  fieldClassName,
  pinSlotClassName,
  mutedTextClassName = "text-muted-foreground",
}: StaffForgotPinFlowProps) {
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<ForgotPinStep>("request");
  const [emailCode, setEmailCode] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [autoSendAttempted, setAutoSendAttempted] = useState(false);

  const trimmedEmail = email.trim();

  const sendCode = useCallback(async () => {
    if (!trimmedEmail || !z.string().email().safeParse(trimmedEmail).success) {
      toast.error("Enter a valid email.");
      return;
    }

    setBusy(true);
    try {
      await requestStaffEmailOtp({ data: { email: trimmedEmail, purpose: "forgot_pin" } });
      toast.success("Verification code sent to your email.");
      setStep("verify");
    } catch (e: unknown) {
      toast.error(humanizeError(e, { fallback: "Could not send verification email." }));
    } finally {
      setBusy(false);
    }
  }, [trimmedEmail]);

  useEffect(() => {
    if (!autoSendCode || autoSendAttempted || !trimmedEmail) return;
    setAutoSendAttempted(true);
    void sendCode();
  }, [autoSendCode, autoSendAttempted, trimmedEmail, sendCode]);

  const verifyCode = useCallback(
    async (code: string = emailCode) => {
      if (!isStaffEmailOtpComplete(code)) {
        toast.error("Enter the 6-digit code from your email.");
        return;
      }

      setBusy(true);
      try {
        const result = await verifyStaffEmailOtp({
          data: { email: trimmedEmail, purpose: "forgot_pin", code },
        });
        setVerificationToken(result.verificationToken);
        setStep("reset");
        toast.success("Code verified. Choose a new PIN.");
      } catch (e: unknown) {
        toast.error(humanizeError(e, { fallback: "Could not verify code." }));
        setEmailCode("");
      } finally {
        setBusy(false);
      }
    },
    [emailCode, trimmedEmail],
  );

  const saveNewPin = useCallback(
    async (pin: string = newPin) => {
      if (!verificationToken) {
        toast.error("Verification expired. Request a new code.");
        setStep("request");
        return;
      }
      if (!isStaffPinComplete(pin)) {
        toast.error("PIN must be 5 digits.");
        return;
      }
      if (pin !== confirmNewPin) {
        toast.error("PINs do not match.");
        setConfirmNewPin("");
        return;
      }

      setBusy(true);
      try {
        await resetStaffPinWithEmailVerification({
          data: {
            email: trimmedEmail,
            verificationToken,
            pin,
          },
        });
        toast.success("PIN updated.");
        onSuccess?.(pin);
      } catch (e: unknown) {
        toast.error(humanizeError(e, { fallback: "Could not reset PIN." }));
        setNewPin("");
        setConfirmNewPin("");
      } finally {
        setBusy(false);
      }
    },
    [confirmNewPin, newPin, onSuccess, trimmedEmail, verificationToken],
  );

  const onResetPinSubmit = (event: FormEvent) => {
    event.preventDefault();
    void saveNewPin();
  };

  const handleConfirmPinComplete = useCallback(
    (pin: string) => {
      if (!isStaffPinComplete(newPin) || pin !== newPin || busy) return;
      void saveNewPin(pin);
    },
    [busy, newPin, saveNewPin],
  );

  return (
    <div className="space-y-4">
      {step === "request" ? (
        <>
          {!autoSendCode || !autoSendAttempted ? (
            <div>
              <Label htmlFor="forgot-pin-email">Email</Label>
              <Input
                id="forgot-pin-email"
                type="email"
                value={email}
                onChange={(e) => onEmailChange?.(e.target.value)}
                readOnly={!emailEditable}
                className={cn("mt-1.5", fieldClassName)}
                autoComplete="username"
              />
            </div>
          ) : (
            <p className={cn("type-body-sm", mutedTextClassName)}>
              Sending a verification code to{" "}
              <span className="font-medium text-foreground">{trimmedEmail}</span>…
            </p>
          )}
          <Button
            type="button"
            disabled={busy || (autoSendCode && autoSendAttempted)}
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
        </>
      ) : null}

      {step === "verify" ? (
        <>
          <p className={cn("type-body-sm", mutedTextClassName)}>
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-foreground">{trimmedEmail}</span>.
          </p>
          <div>
            <Label htmlFor="forgot-pin-email-code">Verification code</Label>
            <div className="mt-2 flex justify-center">
              <AdminEmailOtpInput
                id="forgot-pin-email-code"
                value={emailCode}
                onChange={setEmailCode}
                disabled={busy}
                onComplete={(code) => void verifyCode(code)}
              />
            </div>
          </div>
          {busy ? (
            <p className={cn("flex items-center justify-center gap-2 text-sm", mutedTextClassName)}>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Verifying…
            </p>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => void sendCode()}
            className="w-full"
          >
            Resend code
          </Button>
        </>
      ) : null}

      {step === "reset" ? (
        <form onSubmit={onResetPinSubmit} className="space-y-4">
          <div>
            <Label htmlFor="forgot-pin-new">New PIN</Label>
            <div className="mt-2 flex justify-center">
              <AdminPinInput
                id="forgot-pin-new"
                value={newPin}
                onChange={setNewPin}
                disabled={busy}
                slotClassName={pinSlotClassName}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="forgot-pin-confirm">Confirm PIN</Label>
            <div className="mt-2 flex justify-center">
              <AdminPinInput
                id="forgot-pin-confirm"
                value={confirmNewPin}
                onChange={setConfirmNewPin}
                disabled={busy}
                onComplete={handleConfirmPinComplete}
                slotClassName={pinSlotClassName}
              />
            </div>
            <p className={cn("mt-1 text-center text-xs", mutedTextClassName)}>5 digits</p>
          </div>
          {busy ? (
            <p className={cn("flex items-center justify-center gap-2 text-sm", mutedTextClassName)}>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Saving…
            </p>
          ) : null}
        </form>
      ) : null}

      {onCancel ? (
        <Button type="button" variant="ghost" disabled={busy} onClick={onCancel} className="w-full">
          {cancelLabel}
        </Button>
      ) : null}
    </div>
  );
}
