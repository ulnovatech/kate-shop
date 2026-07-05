import type { StaffRole } from "./db/contracts";
import { adminUrl } from "./admin-base-path";
import {
  hasPermissionKey,
  SYSTEM_ROLE_PERMISSIONS,
  staffAccessToLegacyRole,
  type PermissionAction,
  type PermissionModule,
  type StaffAccess,
  type SystemRoleSlug,
} from "./permissions";

/** Highest privilege wins when multiple legacy roles exist. */
const ROLE_PRIORITY: Record<StaffRole, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  staff: 1,
};

export type AdminPermission =
  | "dashboard"
  | "catalog"
  | "orders"
  | "settings"
  | "team"
  | "audit"
  | "roles";

export type AdminPermissions = {
  role: StaffRole | null;
  roleSlug: string | null;
  roleName: string | null;
  permissionKeys: Set<string>;
  canAccessAdmin: boolean;
  canManageCatalog: boolean;
  canManageOrders: boolean;
  canManageSettings: boolean;
  canManageTeam: boolean;
  canViewAudit: boolean;
  canManageRoles: boolean;
};

export function pickPrimaryRole(roles: StaffRole[]): StaffRole | null {
  if (!roles.length) return null;
  return roles.reduce((best, r) => (ROLE_PRIORITY[r] > ROLE_PRIORITY[best] ? r : best));
}

/** Owner-level settings access — locked owner role or explicit settings.manage. */
export function isShopOwnerAccess(
  access: Pick<StaffAccess, "isLocked" | "roleSlug" | "permissions">,
): boolean {
  const permissionKeys = new Set(access.permissions);
  return (
    access.isLocked ||
    access.roleSlug === "owner" ||
    access.roleSlug === "admin" ||
    hasPermissionKey(permissionKeys, "settings", "manage")
  );
}

export function permissionsFromStaffAccess(access: StaffAccess | null): AdminPermissions {
  if (!access) return emptyPermissions();

  const permissionKeys = new Set(access.permissions);
  const role = staffAccessToLegacyRole(access);
  const shopOwner = isShopOwnerAccess(access);

  return {
    role,
    roleSlug: access.roleSlug,
    roleName: access.roleName,
    permissionKeys,
    canAccessAdmin: permissionKeys.size > 0 || access.isSystem || shopOwner,
    canManageCatalog:
      hasPermissionKey(permissionKeys, "catalog", "view") ||
      hasPermissionKey(permissionKeys, "catalog", "edit") ||
      hasPermissionKey(permissionKeys, "catalog", "create") ||
      hasPermissionKey(permissionKeys, "catalog", "delete"),
    canManageOrders: hasPermissionKey(permissionKeys, "orders", "view"),
    canManageSettings: shopOwner,
    canManageTeam:
      shopOwner || hasPermissionKey(permissionKeys, "team", "manage"),
    canViewAudit: hasPermissionKey(permissionKeys, "audit", "view"),
    canManageRoles: hasPermissionKey(permissionKeys, "roles", "manage"),
  };
}

/** Fallback when matrix tables are not migrated yet. */
export function permissionsForRole(role: StaffRole | null): AdminPermissions {
  if (!role) return emptyPermissions();
  const slug: SystemRoleSlug =
    role === "owner"
      ? "owner"
      : role === "admin"
        ? "admin"
        : role === "manager"
          ? "manager"
          : "staff";

  return permissionsFromStaffAccess({
    userId: "",
    roleId: "",
    roleSlug: slug,
    roleName: slug,
    isSystem: true,
    isLocked: slug === "owner",
    permissions: [...SYSTEM_ROLE_PERMISSIONS[slug]],
  });
}

function emptyPermissions(): AdminPermissions {
  return {
    role: null,
    roleSlug: null,
    roleName: null,
    permissionKeys: new Set(),
    canAccessAdmin: false,
    canManageCatalog: false,
    canManageOrders: false,
    canManageSettings: false,
    canManageTeam: false,
    canViewAudit: false,
    canManageRoles: false,
  };
}

export function hasPermission(perms: AdminPermissions, permission: AdminPermission): boolean {
  switch (permission) {
    case "dashboard":
      return perms.canAccessAdmin;
    case "catalog":
      return perms.canManageCatalog;
    case "orders":
      return perms.canManageOrders;
    case "settings":
      return perms.canManageSettings;
    case "team":
      return perms.canManageTeam;
    case "audit":
      return perms.canViewAudit;
    case "roles":
      return perms.permissionKeys.has("roles.view") || perms.canManageRoles;
    default:
      return false;
  }
}

export function hasMatrixPermission(
  permissionKeys: Set<string>,
  module: PermissionModule,
  action: PermissionAction,
): boolean {
  return hasPermissionKey(permissionKeys, module, action);
}

export function defaultAdminPath(role: StaffRole | null): string {
  if (!role) return adminUrl("/login");
  if (role === "staff") return adminUrl("/orders");
  return adminUrl("/");
}

export function roleLabel(role: StaffRole): string {
  const labels: Record<StaffRole, string> = {
    owner: "Owner",
    admin: "Admin",
    manager: "Manager",
    staff: "Staff",
  };
  return labels[role];
}

export function displayRoleLabel(perms: AdminPermissions): string {
  return perms.roleName ?? (perms.role ? roleLabel(perms.role) : "Staff");
}
