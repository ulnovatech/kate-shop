import { randomBytes } from "node:crypto";
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
import {
  assertOpenInviteToken,
  consumeAdminInvite,
  getOpenInviteByToken,
  hashInviteToken,
} from "@kate/api/invites.server";

import { buildStaffInviteUrl } from "./staff-urls";

function newInviteToken() {
  return randomBytes(32).toString("base64url");
}

const inviteSchema = z.object({
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
      .select("id, slug, is_locked, name")
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
      email: null,
      role: legacyRole,
      role_id: data.role_id,
      token_hash: hashInviteToken(token),
      expires_at: expiresAt,
      created_by: authUserId,
    });
    if (error) throw new Error(error.message);

    await auditFromServer(authUserId, "invite_created", "invite", token.slice(0, 8), null, {
      role_id: data.role_id,
      role: legacyRole,
      role_name: role.name,
      expires_at: expiresAt,
      link_only: true,
    });

    return {
      role: legacyRole,
      roleName: role.name,
      roleId: data.role_id,
      expiresAt,
      inviteUrl: buildStaffInviteUrl(token),
    };
  });

export const validateInviteToken = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(16) }))
  .handler(async ({ data }) => {
    const invite = await getOpenInviteByToken(data.token);
    if (!invite) {
      return { valid: false as const, reason: "invalid" as const };
    }

    return {
      valid: true as const,
      email: invite.email,
      role: invite.role,
    };
  });

function newInternalAuthPassword(): string {
  return randomBytes(32).toString("base64url");
}

export const acceptAdminInvite = createServerFn({ method: "POST" })
  .inputValidator(
    z
      .object({
        token: z.string().min(16),
        email: z.string().trim().email().optional(),
        password: z.string().min(8, "Password must be at least 8 characters").optional(),
        emailVerificationToken: z.string().min(16).optional(),
        oauthUserId: z.string().uuid().optional(),
        pin: staffPinSchema,
      })
      .superRefine((data, ctx) => {
        const inviteBoundEmail = Boolean(
          data.email && !data.oauthUserId && !data.emailVerificationToken,
        );
        const legacyEmail = Boolean(
          data.email && data.emailVerificationToken && data.password && !data.oauthUserId,
        );
        const oauthPath = Boolean(data.oauthUserId);

        if (!inviteBoundEmail && !legacyEmail && !oauthPath) {
          ctx.addIssue({
            code: "custom",
            message: "Provide email and PIN, or sign in with Google first.",
            path: ["email"],
          });
        }
        if (legacyEmail && !data.password) {
          ctx.addIssue({
            code: "custom",
            message: "Password is required.",
            path: ["password"],
          });
        }
        if (legacyEmail && !data.emailVerificationToken) {
          ctx.addIssue({
            code: "custom",
            message: "Email verification is required.",
            path: ["emailVerificationToken"],
          });
        }
        if (!data.oauthUserId && !data.email) {
          ctx.addIssue({
            code: "custom",
            message: "Email is required.",
            path: ["email"],
          });
        }
      }),
  )
  .handler(async ({ data }) => {
    const invite = await assertOpenInviteToken(data.token);

    let email: string;
    let userId: string;

    if (data.oauthUserId) {
      const { data: oauthUser, error: oauthErr } = await supabaseAdmin.auth.admin.getUserById(
        data.oauthUserId,
      );
      if (oauthErr) throw new Error(oauthErr.message);
      if (!oauthUser.user?.email) throw new Error("Google account has no email.");

      email = normalizeStaffEmail(oauthUser.user.email);
      await assertOAuthStaffUser(data.oauthUserId, email);
      userId = data.oauthUserId;
      if (data.password) {
        const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: data.password,
        });
        if (pwErr) throw new Error(pwErr.message);
      }
    } else if (data.emailVerificationToken && data.password) {
      email = normalizeStaffEmail(data.email!);
      await consumeStaffEmailVerificationToken({
        email,
        purpose: "invite_accept",
        verificationToken: data.emailVerificationToken,
      });

      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
      });
      if (createErr) throw new Error(createErr.message);
      if (!created.user) throw new Error("Could not create account.");
      userId = created.user.id;
    } else {
      email = normalizeStaffEmail(data.email!);
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: newInternalAuthPassword(),
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
    await consumeAdminInvite(invite.id, email);

    await auditFromServer(userId, "role_assigned", "user", userId, null, {
      email,
      role: invite.role,
      via: "invite_accept",
    });

    return { email, role: invite.role };
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
