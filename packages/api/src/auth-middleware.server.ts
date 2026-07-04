import { createMiddleware } from "@tanstack/react-start";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { requireSupabaseAuth } from "@kate/supabase/auth-middleware";
import { STAFF_ROLES, type StaffRole } from "@kate/domain/db/contracts";
import {
  hasMatrixPermission,
  permissionsFromStaffAccess,
  type AdminPermissions,
} from "@kate/domain/rbac";
import { loadStaffAccess } from "./server/permissions.server";
import type { PermissionAction, PermissionModule } from "@kate/domain/permissions";

export type AuthContext = {
  userId: string;
  staffRole: StaffRole;
  roleSlug: string;
  roleName: string;
  isOwner: boolean;
  isLockedOwner: boolean;
  canManageCatalog: boolean;
  canManageOrders: boolean;
  permissionKeys: Set<string>;
  permissions: AdminPermissions;
};

async function loadAuthContext(userId: string): Promise<AuthContext> {
  const access = await loadStaffAccess(userId);
  if (!access) {
    throw new Error("Forbidden: staff access required");
  }

  const permissions = permissionsFromStaffAccess(access);
  if (!permissions.canAccessAdmin) {
    throw new Error("Forbidden: staff access required");
  }

  return {
    userId,
    staffRole: permissions.role!,
    roleSlug: access.roleSlug,
    roleName: access.roleName,
    isOwner: access.roleSlug === "owner" || access.roleSlug === "admin",
    isLockedOwner: access.isLocked,
    canManageCatalog: permissions.canManageCatalog,
    canManageOrders: permissions.canManageOrders,
    permissionKeys: permissions.permissionKeys,
    permissions,
  };
}

export const requireStaffAuth = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const userId = context.userId as string;
    const authCtx = await loadAuthContext(userId);
    return next({ context: { ...context, auth: authCtx } });
  });

export const requireCatalogAuth = createMiddleware({ type: "function" })
  .middleware([requireStaffAuth])
  .server(async ({ next, context }) => {
    const auth = context.auth as AuthContext;
    if (!hasMatrixPermission(auth.permissionKeys, "catalog", "view") && !auth.canManageCatalog) {
      throw new Error("Forbidden: catalog access required");
    }
    return next({ context });
  });

export const requireOwnerAuth = createMiddleware({ type: "function" })
  .middleware([requireStaffAuth])
  .server(async ({ next, context }) => {
    const auth = context.auth as AuthContext;
    if (!hasMatrixPermission(auth.permissionKeys, "settings", "manage")) {
      throw new Error("Forbidden: owner access required");
    }
    return next({ context });
  });

export function requirePermission(module: PermissionModule, action: PermissionAction) {
  return createMiddleware({ type: "function" })
    .middleware([requireStaffAuth])
    .server(async ({ next, context }) => {
      const auth = context.auth as AuthContext;
      if (!hasMatrixPermission(auth.permissionKeys, module, action)) {
        throw new Error(`Forbidden: ${module}.${action} required`);
      }
      return next({ context });
    });
}

/** @deprecated use loadStaffAccess — kept for invite bootstrap paths */
export async function assignStaffRole(userId: string, roleId: string, assignedBy?: string) {
  const { error } = await supabaseAdmin.from("staff_role_assignments").upsert(
    {
      user_id: userId,
      role_id: roleId,
      assigned_by: assignedBy ?? null,
      assigned_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}

export { STAFF_ROLES };
