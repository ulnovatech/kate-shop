import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { isStaffGoogleAuthEnabled } from "@/lib/staff-google-auth-enabled";

type AdminGoogleAuthButtonProps = {
  disabled?: boolean;
  busy?: boolean;
  onClick: () => void | Promise<void>;
};

export function AdminGoogleAuthButton({ disabled, busy, onClick }: AdminGoogleAuthButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled || busy}
      onClick={() => void onClick()}
      className={`w-full ${adminPrimaryTouch}`}
    >
      {busy ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          Redirecting…
        </>
      ) : (
        "Continue with Google"
      )}
    </Button>
  );
}

export function AdminAuthDivider() {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <span className="w-full border-t" />
      </div>
      <p className="relative mx-auto w-fit bg-card px-3 text-xs uppercase tracking-wide text-muted-foreground">
        or
      </p>
    </div>
  );
}

type StaffGoogleSignInOptionProps = {
  disabled?: boolean;
  busy?: boolean;
  onClick: () => void | Promise<void>;
};

/** Divider + Google button — hidden when staff Google auth is disabled. */
export function StaffGoogleSignInOption({ disabled, busy, onClick }: StaffGoogleSignInOptionProps) {
  if (!isStaffGoogleAuthEnabled()) return null;

  return (
    <>
      <AdminAuthDivider />
      <AdminGoogleAuthButton disabled={disabled} busy={busy} onClick={onClick} />
    </>
  );
}
