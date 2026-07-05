import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminEmailVerifyStep } from "@/components/admin/onboarding/admin-email-verify-step";
import {
  requestStaffAccountEmailChangeOtp,
  updateStaffAccountEmail,
} from "@/lib/api/staff-account.functions";
import { humanizeError } from "@/lib/errors";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { ADMIN_AUTH_FIELD_CLASS } from "@/components/admin/onboarding/admin-auth-layout";
import { cn } from "@/lib/utils";

type StaffEmailUpdateSectionProps = {
  currentEmail: string;
};

export function StaffEmailUpdateSection({ currentEmail }: StaffEmailUpdateSectionProps) {
  const [newEmail, setNewEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const saveEmail = useMutation({
    mutationFn: async () => {
      const trimmed = newEmail.trim();
      if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        throw new Error("Enter a valid email address.");
      }
      if (!verificationToken) throw new Error("Verify your new email first.");
      return updateStaffAccountEmail({
        data: { newEmail: trimmed, verificationToken },
      });
    },
    onSuccess: async () => {
      toast.success("Email updated. Use your new address to sign in next time.");
      setNewEmail("");
      setVerificationToken(null);
      await supabase.auth.refreshSession();
    },
    onError: (e: unknown) => toast.error(humanizeError(e, { fallback: "Could not update email." })),
  });

  const trimmedNew = newEmail.trim();
  const emailReady =
    trimmedNew.length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedNew) &&
    trimmedNew.toLowerCase() !== currentEmail.toLowerCase();

  return (
    <div className="space-y-4">
      <p className="type-body-sm text-muted-foreground">
        Current address: <span className="font-medium text-foreground">{currentEmail}</span>. We
        will verify the new address before saving.
      </p>

      <div>
        <Label htmlFor="account-new-email">New email</Label>
        <Input
          id="account-new-email"
          type="email"
          autoComplete="email"
          value={newEmail}
          onChange={(e) => {
            setNewEmail(e.target.value);
            setVerificationToken(null);
          }}
          disabled={saveEmail.isPending}
          className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
        />
      </div>

      {emailReady && !verificationToken ? (
        <AdminEmailVerifyStep
          email={trimmedNew}
          purpose="change_email"
          disabled={saveEmail.isPending}
          requestOtp={() =>
            requestStaffAccountEmailChangeOtp({ data: { newEmail: trimmedNew } }).then(
              () => undefined,
            )
          }
          onVerified={setVerificationToken}
        />
      ) : null}

      {verificationToken ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={saveEmail.isPending}
            className={adminPrimaryTouch}
            onClick={() => void saveEmail.mutate()}
          >
            {saveEmail.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save new email"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saveEmail.isPending}
            onClick={() => {
              setVerificationToken(null);
            }}
          >
            Start over
          </Button>
        </div>
      ) : null}
    </div>
  );
}
