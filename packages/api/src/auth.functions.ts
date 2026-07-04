import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { requireStaffAuth, type AuthContext } from "@kate/api/auth-middleware.server";
import { loadStaffAccess } from "@kate/api/server/permissions.server";
import { staffPinSchema } from "@kate/api/staff-pin.server";

const INVALID_PIN_MESSAGE = "Invalid email or PIN.";

async function findAuthUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    const match = data.users.find((user) => user.email?.toLowerCase() === normalized);
    if (match) return match;

    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

const signInWithStaffPinSchema = z.object({
  email: z.string().trim().email(),
  pin: staffPinSchema,
});

export const signInWithStaffPin = createServerFn({ method: "POST" })
  .inputValidator(signInWithStaffPinSchema)
  .handler(async ({ data }) => {
    const { assertStaffPinValid } = await import("@kate/api/staff-pin-auth.server");
    const user = await findAuthUserByEmail(data.email);
    if (!user?.email) {
      throw new Error(INVALID_PIN_MESSAGE);
    }

    const staffAccess = await loadStaffAccess(user.id);
    if (!staffAccess) {
      throw new Error(INVALID_PIN_MESSAGE);
    }

    await assertStaffPinValid(user.id, data.pin);

    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
    });

    if (linkErr) throw new Error(linkErr.message);
    const hashed_token = linkData.properties.hashed_token;
    if (!hashed_token) throw new Error("Could not start PIN sign-in session.");

    return { hashed_token };
  });

export const verifyScreenLockPin = createServerFn({ method: "POST" })
  .middleware([requireStaffAuth])
  .inputValidator(z.object({ pin: staffPinSchema }))
  .handler(async ({ data, context }) => {
    const { assertStaffPinValid } = await import("@kate/api/staff-pin-auth.server");
    const auth = context.auth as AuthContext;
    await assertStaffPinValid(auth.userId, data.pin);
    return { ok: true as const };
  });

const resetStaffPinSchema = z.object({
  email: z.string().trim().email(),
  verificationToken: z.string().min(16),
  pin: staffPinSchema,
});

export const resetStaffPinWithEmailVerification = createServerFn({ method: "POST" })
  .inputValidator(resetStaffPinSchema)
  .handler(async ({ data }) => {
    const { resetStaffPinAfterEmailVerification } =
      await import("@kate/api/staff-pin-reset.server");
    await resetStaffPinAfterEmailVerification(data);
    return { ok: true as const };
  });

const setStaffPinWithCurrentPinSchema = z
  .object({
    currentPin: staffPinSchema,
    pin: staffPinSchema,
  })
  .refine((data) => data.currentPin !== data.pin, {
    message: "Choose a PIN that is different from your current PIN.",
    path: ["pin"],
  });

export const setStaffPinWithCurrentPin = createServerFn({ method: "POST" })
  .middleware([requireStaffAuth])
  .inputValidator(setStaffPinWithCurrentPinSchema)
  .handler(async ({ data, context }) => {
    const { assertStaffPinValid, storeStaffPin } = await import("@kate/api/staff-pin-auth.server");
    const auth = context.auth as AuthContext;
    await assertStaffPinValid(auth.userId, data.currentPin);
    await storeStaffPin(auth.userId, data.pin);
    return { ok: true as const };
  });

export const getStaffPinStatus = createServerFn({ method: "GET" })
  .middleware([requireStaffAuth])
  .handler(async ({ context }) => {
    const auth = context.auth as AuthContext;
    const { data, error } = await supabaseAdmin
      .from("staff_pin_credentials")
      .select("user_id")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { enabled: Boolean(data) };
  });
