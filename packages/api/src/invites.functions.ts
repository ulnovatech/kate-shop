import { createHash, randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { assignStaffRole, requireOwnerAuth } from "@kate/api/auth-middleware.server";
import { storeStaffPin } from "@kate/api/staff-pin-auth.server";
import { consumeStaffEmailVerificationToken } from "@kate/api/staff-email-otp.server";
import { normalizeStaffEmail } from "@kate/api/staff-email-otp.shared";
import { assertOAuthStaffUser } from "@kate/api/staff-oauth.server";
import { staffPinSchema } from "@kate/api/staff-pin.server";
import { auditFromServer } from "@kate/api/audit.server";
import { hasMatrixPermission } from "@kate/domain/rbac";

import { buildStaffInviteUrl } from "./staff-urls";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function newInviteToken() {
  return randomBytes(32).toString("base64url");
}

const inviteSchema = z.object({
  email: z.string().trim().email(),
  role_id: z.string().uuid(),
});

export const createAdminInvite = createServerFn({ method: "POST" })
  .middleware([requireOwnerAuth])
  .inputValidator(inviteSchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as { userId: string; permissionKeys: Set<string> };
    if (!hasMatrixPermission(auth.permissionKeys, "team", "manage")) {
      throw new Error("Forbidden: team access required");
    }

    const { data: role, error: roleErr } = await supabaseAdmin
      .from("roles")
      .select("id, slug, is_locked")
      .eq("id", data.role_id)
      .maybeSingle();

    if (roleErr) throw new Error(roleErr.message);
    if (!role || role.is_locked) throw new Error("Cannot invite with this role");

    const legacyRole =
      role.slug === "admin" ? "admin" : role.slug === "manager" ? "manager" : "staff";

    const authUserId = auth.userId;
    const token = newInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin.from("admin_invites").insert({
      email: data.email.toLowerCase(),
      role: legacyRole,
      role_id: data.role_id,
      token_hash: hashToken(token),
      expires_at: expiresAt,
      created_by: authUserId,
    });
    if (error) throw new Error(error.message);

    await auditFromServer(authUserId, "invite_created", "invite", data.email.toLowerCase(), null, {
      email: data.email.toLowerCase(),
      role_id: data.role_id,
      role: legacyRole,
      expires_at: expiresAt,
    });

    return {
      email: data.email,
      role: legacyRole,
      roleId: data.role_id,
      expiresAt,
      inviteUrl: buildStaffInviteUrl(token),
    };
  });

export const validateInviteToken = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(16) }))
  .handler(async ({ data }) => {
    const { data: invite, error } = await supabaseAdmin
      .from("admin_invites")
      .select("email, role, expires_at, used_at")
      .eq("token_hash", hashToken(data.token))
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!invite || invite.used_at) {
      return { valid: false as const };
    }
    if (new Date(invite.expires_at) < new Date()) {
      return { valid: false as const, reason: "expired" as const };
    }

    return {
      valid: true as const,
      email: invite.email,
      role: invite.role,
    };
  });

export const acceptAdminInvite = createServerFn({ method: "POST" })
  .inputValidator(
    z
      .object({
        token: z.string().min(16),
        password: z.string().min(8, "Password must be at least 8 characters").optional(),
        emailVerificationToken: z.string().min(16).optional(),
        oauthUserId: z.string().uuid().optional(),
        pin: staffPinSchema,
      })
      .superRefine((data, ctx) => {
        if (!data.emailVerificationToken && !data.oauthUserId) {
          ctx.addIssue({
            code: "custom",
            message: "Email verification is required.",
            path: ["emailVerificationToken"],
          });
        }
        if (!data.password && !data.oauthUserId) {
          ctx.addIssue({
            code: "custom",
            message: "Password is required.",
            path: ["password"],
          });
        }
      }),
  )
  .handler(async ({ data }) => {
    const { data: invite, error: findErr } = await supabaseAdmin
      .from("admin_invites")
      .select("id, email, role, role_id, expires_at, used_at")
      .eq("token_hash", hashToken(data.token))
      .maybeSingle();

    if (findErr) throw new Error(findErr.message);
    if (!invite || invite.used_at) throw new Error("Invite is invalid or already used.");
    if (new Date(invite.expires_at) < new Date()) throw new Error("Invite has expired.");

    const email = normalizeStaffEmail(invite.email);
    let userId: string;

    if (data.oauthUserId) {
      await assertOAuthStaffUser(data.oauthUserId, email);
      userId = data.oauthUserId;
      if (data.password) {
        const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: data.password,
        });
        if (pwErr) throw new Error(pwErr.message);
      }
    } else {
      await consumeStaffEmailVerificationToken({
        email,
        purpose: "invite_accept",
        verificationToken: data.emailVerificationToken!,
      });

      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: data.password!,
        email_confirm: true,
      });
      if (createErr) throw new Error(createErr.message);
      if (!created.user) throw new Error("Could not create account.");
      userId = created.user.id;
    }

    const roleId =
      invite.role_id ??
      (
        await supabaseAdmin
          .from("roles")
          .select("id")
          .eq(
            "slug",
            invite.role === "admin" ? "admin" : invite.role === "manager" ? "manager" : "staff",
          )
          .maybeSingle()
      ).data?.id;

    if (!roleId) throw new Error("Invite role is not configured");

    await assignStaffRole(userId, roleId);
    await storeStaffPin(userId, data.pin);

    const { error: usedErr } = await supabaseAdmin
      .from("admin_invites")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invite.id);
    if (usedErr) throw new Error(usedErr.message);

    await auditFromServer(userId, "role_assigned", "user", userId, null, {
      email: invite.email,
      role: invite.role,
      via: "invite_accept",
    });

    return { email: invite.email, role: invite.role };
  });

export const listAdminInvites = createServerFn({ method: "GET" })
  .middleware([requireOwnerAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("admin_invites")
      .select("id, email, role, role_id, expires_at, used_at, created_at, roles(name)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => {
      const roles = row.roles as { name: string } | null;
      return {
        id: row.id,
        email: row.email,
        role: row.role,
        role_id: row.role_id,
        role_name: roles?.name ?? null,
        expires_at: row.expires_at,
        used_at: row.used_at,
        created_at: row.created_at,
      };
    });
  });
