import { supabaseAdmin } from "@kate/supabase/client.server";
import {
  ALL_PERMISSION_KEYS,
  isPermissionKey,
  type PermissionKey,
  type StaffAccess,
  SYSTEM_ROLE_IDS,
} from "@kate/domain/permissions";
import type { StaffRole } from "@kate/domain/db/contracts";
import { pickPrimaryRole } from "@kate/domain/rbac";

export async function loadStaffAccess(userId: string): Promise<StaffAccess | null> {
  const { data: assignment, error } = await supabaseAdmin
    .from("staff_role_assignments")
    .select("role_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!assignment?.role_id) {
    // Fallback: legacy user_roles only (pre-migration)
    const { data: legacy } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const staffRole = pickPrimaryRole((legacy ?? []).map((r) => r.role as StaffRole));
    if (!staffRole) return null;

    const slug =
      staffRole === "owner"
        ? "owner"
        : staffRole === "admin"
          ? "admin"
          : staffRole === "manager"
            ? "manager"
            : "staff";
    const roleId = SYSTEM_ROLE_IDS[slug as keyof typeof SYSTEM_ROLE_IDS];
    const { data: perms } = await supabaseAdmin
      .from("role_permissions")
      .select("permission_key")
      .eq("role_id", roleId);

    const roleRow = await supabaseAdmin.from("roles").select("*").eq("id", roleId).maybeSingle();

    return {
      userId,
      roleId,
      roleSlug: slug,
      roleName: roleRow.data?.name ?? slug,
      isSystem: true,
      isLocked: slug === "owner",
      permissions: (perms ?? [])
        .map((p) => p.permission_key)
        .filter(isPermissionKey) as PermissionKey[],
    };
  }

  const { data: role, error: roleErr } = await supabaseAdmin
    .from("roles")
    .select("id, slug, name, is_system, is_locked")
    .eq("id", assignment.role_id)
    .maybeSingle();

  if (roleErr) throw new Error(roleErr.message);
  if (!role) return null;

  const { data: perms, error: permErr } = await supabaseAdmin
    .from("role_permissions")
    .select("permission_key")
    .eq("role_id", role.id);

  if (permErr) throw new Error(permErr.message);

  return {
    userId,
    roleId: role.id,
    roleSlug: role.slug,
    roleName: role.name,
    isSystem: role.is_system,
    isLocked: role.is_locked,
    permissions: (perms ?? [])
      .map((p) => p.permission_key)
      .filter(isPermissionKey) as PermissionKey[],
  };
}

export function validatePermissionKeys(keys: string[]): PermissionKey[] {
  const unique = [...new Set(keys)];
  for (const key of unique) {
    if (!isPermissionKey(key)) {
      throw new Error(`Invalid permission key: ${key}`);
    }
  }
  return unique as PermissionKey[];
}

export function allPermissionKeysForOwner(): PermissionKey[] {
  return [...ALL_PERMISSION_KEYS];
}
