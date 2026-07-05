import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { displayRoleLabel } from "@/lib/rbac";
import { ADMIN_LOGIN_PATH } from "@/lib/admin-base-path";
import { StaffPinSettings } from "@/components/staff-pin-settings";
import { StaffEmailUpdateSection } from "./staff-email-update-section";
import { StaffRecoveryPasswordSection } from "./staff-recovery-password-section";

function AccountSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-card shadow-elevated">
      <div>
        <h2 className="type-h3">{title}</h2>
        <p className="mt-1 type-body-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function StaffAccountPage() {
  const { user, permissions } = useAuth();
  const email = user?.email ?? "";
  const roleLabel = displayRoleLabel(permissions);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-stack-lg">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-primary">
          <UserCircle className="size-6" aria-hidden />
          <h1 className="type-h2">My account</h1>
        </div>
        <p className="type-body-sm text-muted-foreground">
          Manage your sign-in details. These settings apply only to you — not the shop.
        </p>
      </header>

      <section className="rounded-lg border bg-muted/30 p-card">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="type-caption text-muted-foreground">Work email</dt>
            <dd className="mt-0.5 font-medium">{email || "—"}</dd>
          </div>
          <div>
            <dt className="type-caption text-muted-foreground">Role</dt>
            <dd className="mt-0.5 font-medium">{roleLabel}</dd>
          </div>
        </dl>
      </section>

      <AccountSection
        title="Sign-in PIN"
        description="Your 5-digit PIN is used for daily sign-in and screen unlock."
      >
        <StaffPinSettings />
      </AccountSection>

      {email ? (
        <>
          <AccountSection
            title="Email address"
            description="Change the email you use to sign in. We verify the new address before saving."
          >
            <StaffEmailUpdateSection currentEmail={email} />
          </AccountSection>

          <AccountSection
            title="Recovery password"
            description="Optional backup credential stored with your account — separate from your PIN."
          >
            <StaffRecoveryPasswordSection currentEmail={email} />
          </AccountSection>
        </>
      ) : (
        <p className="type-body-sm text-muted-foreground">
          <Link to={ADMIN_LOGIN_PATH} className="font-medium text-primary hover:underline">
            Sign in again
          </Link>{" "}
          to manage email and recovery password.
        </p>
      )}
    </div>
  );
}
