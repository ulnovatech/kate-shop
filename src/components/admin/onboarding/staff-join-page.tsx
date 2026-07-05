import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { getBootstrapStatus } from "@/lib/api/bootstrap.functions";
import { defaultAdminPath } from "@/lib/rbac";
import { ADMIN_LOGIN_PATH, ADMIN_SETUP_PATH } from "@/lib/admin-base-path";
import { withTimeout } from "@/lib/with-timeout";
import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { AuthCardSkeleton } from "@/components/loading-states";
import { Button } from "@/components/ui/button";
import { useAdminShopName } from "@/components/admin-brand-mark";
import { AdminAuthLayout } from "./admin-auth-layout";

const BOOTSTRAP_TIMEOUT_MS = 6_000;

export function StaffJoinPage() {
  const shopName = useAdminShopName();
  const navigate = useNavigate();
  const { user, isAdmin, loading, staffRole } = useAuth();
  const [ready, setReady] = useState(false);
  const [bootstrapRequired, setBootstrapRequired] = useState(false);

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

  if (!ready) {
    return <AuthCardSkeleton />;
  }

  return (
    <AdminAuthLayout
      shopName={shopName}
      title="Join your team"
      description="Open the invite link your shop owner sent you on this phone. It works once and walks you through signup."
    >
      <div className="space-y-4">
        <p className="type-body-sm text-muted-foreground">
          If you already installed the app, tap the invite link again in WhatsApp or email.
        </p>
        <Button asChild variant="default" className={`w-full ${adminPrimaryTouch}`}>
          <Link to={ADMIN_LOGIN_PATH}>Sign in</Link>
        </Button>
        <p className="text-center type-caption text-muted-foreground">
          <Link to={ADMIN_LOGIN_PATH} className="font-medium text-primary hover:underline">
            Forgot PIN?
          </Link>
        </p>
      </div>

      {bootstrapRequired && !isNativeStaffApp() ? (
        <p className="mt-stack type-caption text-muted-foreground">
          Setting up a new shop?{" "}
          <Link to={ADMIN_SETUP_PATH} className="font-medium text-primary hover:underline">
            Run shop setup
          </Link>
        </p>
      ) : null}
    </AdminAuthLayout>
  );
}
