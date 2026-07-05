import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireStaffAuth, type AuthContext } from "@kate/api/auth-middleware.server";
import {
  requestStaffEmailChangeOtp,
  requestStaffRecoveryPasswordOtp,
  updateStaffEmailAddress,
  updateStaffRecoveryPassword,
} from "@kate/api/staff-account.server";

export const requestStaffAccountEmailChangeOtp = createServerFn({ method: "POST" })
  .middleware([requireStaffAuth])
  .inputValidator(z.object({ newEmail: z.string().trim().email() }))
  .handler(async ({ data, context }) => {
    const auth = context.auth as AuthContext;
    return requestStaffEmailChangeOtp(auth, data.newEmail);
  });

export const updateStaffAccountEmail = createServerFn({ method: "POST" })
  .middleware([requireStaffAuth])
  .inputValidator(
    z.object({
      newEmail: z.string().trim().email(),
      verificationToken: z.string().min(16),
    }),
  )
  .handler(async ({ data, context }) => {
    const auth = context.auth as AuthContext;
    return updateStaffEmailAddress(auth, data.newEmail, data.verificationToken);
  });

export const requestStaffAccountRecoveryPasswordOtp = createServerFn({ method: "POST" })
  .middleware([requireStaffAuth])
  .handler(async ({ context }) => {
    const auth = context.auth as AuthContext;
    return requestStaffRecoveryPasswordOtp(auth);
  });

export const updateStaffAccountRecoveryPassword = createServerFn({ method: "POST" })
  .middleware([requireStaffAuth])
  .inputValidator(
    z.object({
      verificationToken: z.string().min(16),
      password: z.string().min(8, "Password must be at least 8 characters"),
    }),
  )
  .handler(async ({ data, context }) => {
    const auth = context.auth as AuthContext;
    return updateStaffRecoveryPassword(auth, data.verificationToken, data.password);
  });
