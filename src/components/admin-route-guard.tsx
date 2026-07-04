import { type ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { ADMIN_LOGIN_PATH } from "@/lib/admin-base-path";
import { defaultAdminPath, hasPermission, type AdminPermission } from "@/lib/rbac";

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
      navigate({ to: ADMIN_LOGIN_PATH, replace: true });
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
