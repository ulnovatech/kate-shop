import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { requireSupabaseAuth } from "@kate/supabase/auth-middleware";
import { requireStaffAuth } from "@kate/api/auth-middleware.server";
import { loadStaffAccess, validatePermissionKeys } from "@kate/api/server/permissions.server";
import {
  ALL_PERMISSION_KEYS,
  permissionActionLabel,
  permissionModuleLabel,
  type PermissionKey,
} from "@kate/domain/permissions";

export const fetchStaffAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId as string;
    return loadStaffAccess(userId);
  });

export type RoleRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_system: boolean;
  is_locked: boolean;
  permission_keys: PermissionKey[];
};

export const listRoles = createServerFn({ method: "GET" })
  .middleware([requireStaffAuth])
  .handler(async ({ context }) => {
    const auth = context.auth as { permissionKeys: Set<string> };
    if (!auth.permissionKeys.has("roles.view")) {
      throw new Error("Forbidden: roles access required");
    }

    const { data: roles, error } = await supabaseAdmin
      .from("roles")
      .select("id, slug, name, description, is_system, is_locked")
      .order("is_system", { ascending: false })
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);

    const { data: perms, error: pErr } = await supabaseAdmin
      .from("role_permissions")
      .select("role_id, permission_key");

    if (pErr) throw new Error(pErr.message);

    const byRole = new Map<string, PermissionKey[]>();
    for (const p of perms ?? []) {
      const list = byRole.get(p.role_id) ?? [];
      if (ALL_PERMISSION_KEYS.includes(p.permission_key as PermissionKey)) {
        list.push(p.permission_key as PermissionKey);
      }
      byRole.set(p.role_id, list);
    }

    return (roles ?? []).map(
      (r): RoleRow => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description ?? "",
        is_system: r.is_system,
        is_locked: r.is_locked,
        permission_keys: byRole.get(r.id) ?? [],
      }),
    );
  });

export const listInvitableRoles = createServerFn({ method: "GET" })
  .middleware([requireStaffAuth])
  .handler(async ({ context }) => {
    const auth = context.auth as { permissionKeys: Set<string> };
    if (!auth.permissionKeys.has("team.manage")) {
      throw new Error("Forbidden: team access required");
    }

    const { data, error } = await supabaseAdmin
      .from("roles")
      .select("id, slug, name, description, is_system, is_locked")
      .eq("is_locked", false)
      .neq("slug", "owner")
      .order("is_system", { ascending: false })
      .order("name");

    if (error) throw new Error(error.message);
    return data ?? [];
  });

const saveCustomRoleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional(),
  permission_keys: z.array(z.string()).min(1),
});

export const saveCustomRole = createServerFn({ method: "POST" })
  .middleware([requireStaffAuth])
  .inputValidator(saveCustomRoleSchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as { permissionKeys: Set<string> };
    if (!auth.permissionKeys.has("roles.manage")) {
      throw new Error("Forbidden: cannot manage roles");
    }

    const keys = validatePermissionKeys(data.permission_keys);

    if (data.id) {
      const { data: existing, error: loadErr } = await supabaseAdmin
        .from("roles")
        .select("id, is_system, is_locked, slug")
        .eq("id", data.id)
        .maybeSingle();

      if (loadErr) throw new Error(loadErr.message);
      if (!existing) throw new Error("Role not found");
      if (existing.is_locked) {
        throw new Error("The Owner role cannot be modified");
      }
      if (existing.is_system && existing.slug !== "admin") {
        throw new Error("System roles cannot be edited — duplicate this role instead");
      }

      const { error: updErr } = await supabaseAdmin
        .from("roles")
        .update({
          name: data.name,
          description: data.description?.trim() ?? "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (updErr) throw new Error(updErr.message);

      await supabaseAdmin.from("role_permissions").delete().eq("role_id", data.id);
      await supabaseAdmin
        .from("role_permissions")
        .insert(keys.map((permission_key) => ({ role_id: data.id!, permission_key })));

      return { id: data.id };
    }

    const slug =
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 40) || "custom_role";

    const { data: created, error: insErr } = await supabaseAdmin
      .from("roles")
      .insert({
        slug: `${slug}_${crypto.randomUUID().slice(0, 8)}`,
        name: data.name,
        description: data.description?.trim() ?? "",
        is_system: false,
        is_locked: false,
      })
      .select("id")
      .single();

    if (insErr) throw new Error(insErr.message);

    const { error: permErr } = await supabaseAdmin
      .from("role_permissions")
      .insert(keys.map((permission_key) => ({ role_id: created.id, permission_key })));
    if (permErr) throw new Error(permErr.message);

    return { id: created.id };
  });

export const getPermissionMatrixMeta = createServerFn({ method: "GET" }).handler(async () => {
  return {
    keys: [...ALL_PERMISSION_KEYS],
    modules: ALL_PERMISSION_KEYS.reduce(
      (acc, key) => {
        const [mod, act] = key.split(".") as [string, string];
        if (!acc[mod]) acc[mod] = [];
        acc[mod].push({
          key,
          action: act,
          actionLabel: permissionActionLabel(act as never),
        });
        return acc;
      },
      {} as Record<string, { key: string; action: string; actionLabel: string }[]>,
    ),
    moduleLabels: Object.fromEntries(
      [...new Set(ALL_PERMISSION_KEYS.map((k) => k.split(".")[0]))].map((m) => [
        m,
        permissionModuleLabel(m as never),
      ]),
    ),
  };
});
