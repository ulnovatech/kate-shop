import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { completeStaffAuthFromUrl } from "@/integrations/supabase/staff-mobile-auth";
import { AuthCardSkeleton } from "@/components/loading-states";
import { humanizeError } from "@/lib/errors";
import { getBootstrapStatus } from "@/lib/api/bootstrap.functions";
import { ADMIN_JOIN_PATH, ADMIN_SETUP_PATH, ADMIN_SIGNUP_PATH } from "@/lib/admin-base-path";
import { loadStaffOnboardingOAuth } from "@/lib/staff-onboarding-oauth";

export const Route = createFileRoute("/admin/login-callback")({
  component: StaffLoginCallback,
});

function StaffLoginCallback() {
  const navigate = Route.useNavigate();
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { session, error } = await completeStaffAuthFromUrl(window.location.href);
      if (cancelled) return;

      if (error) {
        toast.error(humanizeError(error, { fallback: "Could not complete sign-in." }));
        navigate({ to: ADMIN_JOIN_PATH, replace: true });
        return;
      }

      if (!session) {
        setMessage("No sign-in session found. Redirecting…");
        navigate({ to: ADMIN_JOIN_PATH, replace: true });
        return;
      }

      const onboarding = loadStaffOnboardingOAuth();
      if (onboarding?.kind === "bootstrap") {
        try {
          const status = await getBootstrapStatus();
          if (status.required) {
            navigate({ to: ADMIN_SETUP_PATH, replace: true });
            return;
          }
        } catch {
          // fall through to default admin redirect
        }
      }

      if (onboarding?.kind === "invite") {
        navigate({ to: ADMIN_SIGNUP_PATH, replace: true });
        return;
      }

      navigate({ to: "/admin", replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <AuthCardSkeleton />
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
