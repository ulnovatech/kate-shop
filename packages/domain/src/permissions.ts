/**
 * Addendum A9 — permission matrix (module × action) and custom roles.
 */

import type { StaffRole } from "./db/contracts";

export const PERMISSION_MODULES = [
  "catalog",
  "orders",
  "payments",
  "settings",
  "team",
  "audit",
  "inventory",
  "delivery",
  "roles",
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "export",
  "manage",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export type PermissionKey = `${PermissionModule}.${PermissionAction}`;

export const ALL_PERMISSION_KEYS = [
  "catalog.view",
  "catalog.create",
  "catalog.edit",
  "catalog.delete",
  "orders.view",
  "orders.create",
  "orders.edit",
  "orders.delete",
  "orders.approve",
  "orders.export",
  "payments.view",
  "payments.create",
  "payments.approve",
  "payments.export",
  "settings.view",
  "settings.manage",
  "team.view",
  "team.manage",
  "audit.view",
  "inventory.view",
  "inventory.edit",
  "delivery.view",
  "delivery.manage",
  "roles.view",
  "roles.manage",
] as const satisfies readonly PermissionKey[];

export type SystemRoleSlug =
  | "owner"
  | "admin"
  | "manager"
  | "staff"
  | "delivery_rider"
  | "accountant"
  | "stock_controller";

export const SYSTEM_ROLE_SLUGS = [
  "owner",
  "admin",
  "manager",
  "staff",
  "delivery_rider",
  "accountant",
  "stock_controller",
] as const satisfies readonly SystemRoleSlug[];

/** Fixed UUIDs for seeded system roles (stable across environments). */
export const SYSTEM_ROLE_IDS: Record<SystemRoleSlug, string> = {
  owner: "a9000001-0001-4001-a001-000000000001",
  admin: "a9000001-0001-4001-a001-000000000002",
  manager: "a9000001-0001-4001-a001-000000000003",
  staff: "a9000001-0001-4001-a001-000000000004",
  delivery_rider: "a9000001-0001-4001-a001-000000000005",
  accountant: "a9000001-0001-4001-a001-000000000006",
  stock_controller: "a9000001-0001-4001-a001-000000000007",
};

const ALL_KEYS_SET = new Set<string>(ALL_PERMISSION_KEYS);

export function isPermissionKey(value: string): value is PermissionKey {
  return ALL_KEYS_SET.has(value);
}

export function permissionKey(module: PermissionModule, action: PermissionAction): PermissionKey {
  const key = `${module}.${action}` as PermissionKey;
  if (!isPermissionKey(key)) {
    throw new Error(`Invalid permission: ${module}.${action}`);
  }
  return key;
}

export type StaffAccess = {
  userId: string;
  roleId: string;
  roleSlug: string;
  roleName: string;
  isSystem: boolean;
  isLocked: boolean;
  permissions: PermissionKey[];
};

export function permissionSet(keys: Iterable<string>): Set<string> {
  return new Set(keys);
}

export function hasPermissionKey(
  permissions: Set<string> | string[],
  module: PermissionModule,
  action: PermissionAction,
): boolean {
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  return set.has(permissionKey(module, action));
}

export function permissionActionLabel(action: PermissionAction): string {
  const labels: Record<PermissionAction, string> = {
    view: "View",
    create: "Create",
    edit: "Edit",
    delete: "Delete",
    approve: "Approve",
    export: "Export",
    manage: "Manage",
  };
  return labels[action];
}

export function permissionModuleLabel(module: PermissionModule): string {
  const labels: Record<PermissionModule, string> = {
    catalog: "Catalog",
    orders: "Orders",
    payments: "Payments",
    settings: "Settings",
    team: "Team",
    audit: "Audit log",
    inventory: "Inventory",
    delivery: "Delivery",
    roles: "Roles",
  };
  return labels[module];
}

/** Seed matrix for system roles (used in tests; DB is source of truth in prod). */
export const SYSTEM_ROLE_PERMISSIONS: Record<SystemRoleSlug, PermissionKey[]> = {
  owner: [...ALL_PERMISSION_KEYS],
  admin: [...ALL_PERMISSION_KEYS],
  manager: ALL_PERMISSION_KEYS.filter((k) => k !== "settings.manage" && k !== "team.manage"),
  staff: ["catalog.view", "orders.view", "orders.edit", "payments.view", "payments.create"],
  delivery_rider: ["orders.view", "orders.approve"],
  accountant: [
    "orders.view",
    "payments.view",
    "payments.create",
    "payments.approve",
    "payments.export",
  ],
  stock_controller: ["catalog.view", "catalog.edit", "inventory.view", "inventory.edit"],
};

export function legacyAppRoleForSlug(slug: string): "owner" | "admin" | "manager" | "staff" {
  if (slug === "owner") return "owner";
  if (slug === "admin") return "admin";
  if (slug === "manager" || slug === "stock_controller") return "manager";
  return "staff";
}

export function staffAccessToLegacyRole(access: StaffAccess): StaffRole {
  return legacyAppRoleForSlug(access.roleSlug);
}
