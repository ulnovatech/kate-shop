import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthCardSkeleton } from "@/components/loading-states";
import { coerceStaffRole } from "@kate/domain/staff-auth-mode";
import { isStaffOpenMode, openStaffHomePath, setOpenStaffRole } from "@/lib/staff-open-mode";
import { ADMIN_JOIN_PATH } from "@/lib/admin-base-path";

export const Route = createFileRoute("/admin/r/$role")({
  staticData: { adminRouteHeading: "Enter as role" as const },
  component: OpenRoleEntry,
});

function OpenRoleEntry() {
  const { role: roleParam } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isStaffOpenMode()) {
      navigate({ to: ADMIN_JOIN_PATH, replace: true });
      return;
    }
    const role = setOpenStaffRole(coerceStaffRole(roleParam));
    navigate({ to: openStaffHomePath(role), replace: true });
  }, [roleParam, navigate]);

  return <AuthCardSkeleton />;
}
