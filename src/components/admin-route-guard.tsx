import { type ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { resolveStaffUnauthenticatedRedirect } from "@/lib/staff-auth-entry";
import { defaultAdminPath, hasPermission, type AdminPermission } from "@/lib/rbac";
import { isStaffOpenMode } from "@/lib/staff-open-mode";

type Props = {
  permission: AdminPermission;
  children: ReactNode;
};

export function AdminRouteGuard({ permission, children }: Props) {
  const { initialLoading, permissions } = useAuth();
  const navigate = useNavigate();
  const allowed = permissions.canAccessAdmin && hasPermission(permissions, permission);

  useEffect(() => {
    if (initialLoading) return;
    if (!permissions.canAccessAdmin) {
      if (isStaffOpenMode()) {
        navigate({ to: defaultAdminPath(permissions.role), replace: true });
        return;
      }
      navigate(resolveStaffUnauthenticatedRedirect());
      return;
    }
    if (!hasPermission(permissions, permission)) {
      navigate({ to: defaultAdminPath(permissions.role), replace: true });
    }
  }, [initialLoading, permissions, permission, navigate]);

  if (!initialLoading && !allowed) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Opening your workspace…
      </p>
    );
  }

  return <>{children}</>;
}
