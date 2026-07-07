import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { assignStaffRole } from "@kate/api/auth-middleware.server";
import { storeStaffPin } from "@kate/api/staff-pin-auth.server";
import { consumeStaffEmailVerificationToken } from "@kate/api/staff-email-otp.server";
import { normalizeStaffEmail } from "@kate/api/staff-email-otp.shared";
import { assertOAuthStaffUser } from "@kate/api/staff-oauth.server";
import { assertStaffGoogleAuthEnabled } from "@kate/api/staff-google-auth.server";
import { staffPinSchema } from "@kate/api/staff-pin.server";
import { writeAuditLog } from "@kate/api/audit.server";
import { SYSTEM_ROLE_IDS } from "@kate/domain/permissions";
import { withTimeout } from "@/lib/with-timeout";

const BOOTSTRAP_TIMEOUT_MS = 5_000;

async function bootstrapRequired(): Promise<boolean> {
  const check = async (): Promise<boolean> => {
    const { data, error } = await supabaseAdmin.rpc("is_bootstrap_required");
    if (error) {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .in("role", ["owner", "admin"]);
      return (count ?? 0) === 0;
    }
    return Boolean(data);
  };

  return withTimeout(check(), BOOTSTRAP_TIMEOUT_MS, "Bootstrap check");
}

export const getBootstrapStatus = createServerFn({ method: "GET" }).handler(async () => {
  const required = await bootstrapRequired();
  return {
    required,
    tokenRequired: Boolean(process.env.BOOTSTRAP_TOKEN?.trim()),
  };
});

const completeBootstrapSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
    bootstrapToken: z.string().optional(),
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
  });

export const completeBootstrap = createServerFn({ method: "POST" })
  .inputValidator(completeBootstrapSchema)
  .handler(async ({ data }) => {
    if (!(await bootstrapRequired())) {
      throw new Error("Setup already completed. Sign in at /admin/login.");
    }

    const expected = process.env.BOOTSTRAP_TOKEN?.trim();
    if (expected && data.bootstrapToken?.trim() !== expected) {
      throw new Error("Invalid setup token.");
    }

    const email = normalizeStaffEmail(data.email);
    let userId: string;

    if (data.oauthUserId) {
      assertStaffGoogleAuthEnabled();
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
        purpose: "signup",
        verificationToken: data.emailVerificationToken!,
      });

      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: data.password!,
        email_confirm: true,
      });
      if (createErr) throw new Error(createErr.message);
      if (!created.user) throw new Error("Could not create owner account.");
      userId = created.user.id;
    }

    await assignStaffRole(userId, SYSTEM_ROLE_IDS.owner);
    await storeStaffPin(userId, data.pin);

    await supabaseAdmin.from("system_config").upsert({
      key: "bootstrap_completed",
      value: { completed: true, owner_id: userId, at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    });

    await writeAuditLog({
      actorId: userId,
      action: "other",
      entityType: "bootstrap",
      entityId: userId,
      payload: { event: "bootstrap_completed", email },
    });

    return { email };
  });
