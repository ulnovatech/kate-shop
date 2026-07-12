import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AuthCardSkeleton } from "@/components/loading-states";
import { isStaffOpenMode, openStaffHomePath } from "@/lib/staff-open-mode";

/** When staff auth is hibernated, skip rendering auth UI and enter admin. */
export function StaffAuthHibernateGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const open = isStaffOpenMode();

  useEffect(() => {
    if (!open) return;
    navigate({ to: openStaffHomePath(), replace: true });
  }, [open, navigate]);

  if (open) {
    return <AuthCardSkeleton />;
  }

  return <>{children}</>;
}
