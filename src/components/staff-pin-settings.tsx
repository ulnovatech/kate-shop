import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AdminPinInput, isStaffPinComplete } from "@/components/admin-pin-input";
import { AdminEmailVerifyStep } from "@/components/admin/onboarding/admin-email-verify-step";
import {
  resetStaffPinWithEmailVerification,
  setStaffPinWithCurrentPin,
} from "@/lib/api/auth.functions";
import { ADMIN_LOGIN_PATH } from "@/lib/admin-base-path";
import { useAuth } from "@/lib/auth";
import { humanizeError } from "@/lib/errors";

type PinSettingsView = "change" | "forgot";

export function StaffPinSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const email = user?.email ?? "";

  const [view, setView] = useState<PinSettingsView>("change");
  const [currentPin, setCurrentPin] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const savePin = useMutation({
    mutationFn: () => {
      if (!isStaffPinComplete(currentPin)) {
        throw new Error("Enter your current PIN.");
      }
      if (!isStaffPinComplete(pin)) {
        throw new Error("PIN must be 5 digits.");
      }
      if (pin !== confirmPin) {
        throw new Error("PINs do not match.");
      }
      return setStaffPinWithCurrentPin({ data: { currentPin, pin } });
    },
    onSuccess: () => {
      toast.success("PIN updated");
      setCurrentPin("");
      setPin("");
      setConfirmPin("");
      void qc.invalidateQueries({ queryKey: ["staff-pin-status"] });
    },
    onError: (e: unknown) =>
      toast.error(humanizeError(e, { fallback: "Could not update PIN." })),
  });

  const resetViaEmail = useMutation({
    mutationFn: () => {
      if (!email) throw new Error("Account email is missing.");
      if (!verificationToken) throw new Error("Verify your email first.");
      if (!isStaffPinComplete(pin)) {
        throw new Error("PIN must be 5 digits.");
      }
      if (pin !== confirmPin) {
        throw new Error("PINs do not match.");
      }
      return resetStaffPinWithEmailVerification({
        data: { email, verificationToken, pin },
      });
    },
    onSuccess: () => {
      toast.success("PIN updated");
      setView("change");
      setVerificationToken(null);
      setPin("");
      setConfirmPin("");
      void qc.invalidateQueries({ queryKey: ["staff-pin-status"] });
    },
    onError: (e: unknown) =>
      toast.error(humanizeError(e, { fallback: "Could not reset PIN." })),
  });

  const canSaveChange =
    isStaffPinComplete(currentPin) && isStaffPinComplete(pin) && pin === confirmPin;

  const canSaveForgot =
    Boolean(verificationToken) && isStaffPinComplete(pin) && pin === confirmPin;

  if (!email) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in again to manage your PIN.
      </p>
    );
  }

  if (view === "forgot") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          We will email a verification code to{" "}
          <span className="font-medium text-foreground">{email}</span>, then you can choose a
          new PIN.
        </p>

        {!verificationToken ? (
          <AdminEmailVerifyStep
            email={email}
            purpose="forgot_pin"
            disabled={resetViaEmail.isPending}
            onVerified={setVerificationToken}
          />
        ) : (
          <>
            <div>
              <Label htmlFor="staff-pin-new">New PIN</Label>
              <div className="mt-2">
                <AdminPinInput id="staff-pin-new" value={pin} onChange={setPin} />
              </div>
            </div>
            <div>
              <Label htmlFor="staff-pin-new-confirm">Confirm new PIN</Label>
              <div className="mt-2">
                <AdminPinInput id="staff-pin-new-confirm" value={confirmPin} onChange={setConfirmPin} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={resetViaEmail.isPending || !canSaveForgot}
                onClick={() => void resetViaEmail.mutate()}
              >
                {resetViaEmail.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Saving
                  </>
                ) : (
                  "Save new PIN"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={resetViaEmail.isPending}
                onClick={() => {
                  setView("change");
                  setVerificationToken(null);
                  setPin("");
                  setConfirmPin("");
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        )}

        {!verificationToken ? (
          <Button
            type="button"
            variant="ghost"
            className="px-0 text-muted-foreground"
            onClick={() => setView("change")}
          >
            Back to change PIN
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Daily sign-in uses your email and PIN. Update it here or reset via email if you forgot
        it.
      </p>

      <div>
        <Label htmlFor="staff-pin-current">Current PIN</Label>
        <div className="mt-2">
          <AdminPinInput id="staff-pin-current" value={currentPin} onChange={setCurrentPin} />
        </div>
      </div>

      <div>
        <Label htmlFor="staff-pin">New PIN</Label>
        <div className="mt-2">
          <AdminPinInput id="staff-pin" value={pin} onChange={setPin} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">5 digits</p>
      </div>

      <div>
        <Label htmlFor="staff-pin-confirm">Confirm new PIN</Label>
        <div className="mt-2">
          <AdminPinInput id="staff-pin-confirm" value={confirmPin} onChange={setConfirmPin} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={savePin.isPending || !canSaveChange}
          onClick={() => void savePin.mutate()}
        >
          {savePin.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Saving
            </>
          ) : (
            "Update PIN"
          )}
        </Button>
        <button
          type="button"
          className="text-sm font-medium text-primary hover:underline"
          onClick={() => {
            setView("forgot");
            setCurrentPin("");
            setPin("");
            setConfirmPin("");
            setVerificationToken(null);
          }}
        >
          Forgot your PIN?
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        You can also reset your PIN from the{" "}
        <Link to={ADMIN_LOGIN_PATH} className="font-medium text-primary hover:underline">
          sign-in screen
        </Link>
        .
      </p>
    </div>
  );
}
