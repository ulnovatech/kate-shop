import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { getSupabasePublicConfig } from "@kate/supabase/env";
import type { Database } from "@kate/supabase/types";
import { STAFF_ROLES, type StaffRole } from "@kate/domain/db/contracts";
import {
  hasMatrixPermission,
  permissionsForRole,
  permissionsFromStaffAccess,
  type AdminPermissions,
} from "@kate/domain/rbac";
import { loadStaffAccess } from "./server/permissions.server";
import type { PermissionAction, PermissionModule } from "@kate/domain/permissions";
import {
  isStaffAuthRequired,
  OPEN_STAFF_ACTOR_ID,
  KATE_OPEN_ROLE_HEADER,
  parseOpenStaffRoleHeader,
} from "./staff-auth-mode.server";

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

function authContextFromRole(role: StaffRole, userId: string): AuthContext {
  const permissions = permissionsForRole(role);
  return {
    userId,
    staffRole: role,
    roleSlug: permissions.roleSlug ?? role,
    roleName: permissions.roleName ?? role,
    isOwner: permissions.canManageSettings,
    isLockedOwner: role === "owner",
    canManageCatalog: permissions.canManageCatalog,
    canManageOrders: permissions.canManageOrders,
    permissionKeys: permissions.permissionKeys,
    permissions,
  };
}

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

async function resolveBearerUserId(): Promise<string> {
  const { url, publishableKey } = getSupabasePublicConfig();
  const request = getRequest();

  if (!request?.headers) {
    throw new Error("Unauthorized: No request headers available");
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    throw new Error("Unauthorized: No authorization header provided");
  }
  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Only Bearer tokens are supported");
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    throw new Error("Unauthorized: No token provided");
  }

  const supabase = createClient<Database>(url, publishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    throw new Error("Unauthorized: Invalid token");
  }
  if (!data.claims.sub) {
    throw new Error("Unauthorized: No user ID found in token");
  }

  return data.claims.sub;
}

export const requireStaffAuth = createMiddleware({ type: "function" }).server(
  async ({ next, context }) => {
    if (!isStaffAuthRequired()) {
      const request = getRequest();
      const role = parseOpenStaffRoleHeader(request?.headers.get(KATE_OPEN_ROLE_HEADER));
      const authCtx = authContextFromRole(role, OPEN_STAFF_ACTOR_ID);
      return next({
        context: {
          ...context,
          userId: authCtx.userId,
          auth: authCtx,
        },
      });
    }

    const userId = await resolveBearerUserId();
    const authCtx = await loadAuthContext(userId);
    return next({
      context: {
        ...context,
        userId,
        auth: authCtx,
      },
    });
  },
);

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
    if (!auth.permissions.canManageSettings) {
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
