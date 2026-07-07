import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { STAFF_EMAIL_OTP_PURPOSES } from "@kate/api/staff-email-otp.shared";

const purposeSchema = z.enum(STAFF_EMAIL_OTP_PURPOSES);

const requestSchema = z
  .object({
    email: z.string().trim().email(),
    purpose: purposeSchema,
    inviteToken: z.string().min(16).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.purpose === "invite_accept" && !data.inviteToken) {
      ctx.addIssue({
        code: "custom",
        message: "Invite token is required.",
        path: ["inviteToken"],
      });
    }
  });

const verifySchema = z.object({
  email: z.string().trim().email(),
  purpose: purposeSchema,
  code: z.string().trim().length(6),
});

/** Whether staff OTP email delivery is configured. */
export const getStaffEmailOtpDeliveryStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getStaffEmailOtpDeliveryStatusImpl } = await import("@kate/api/staff-email-otp.server");
    return getStaffEmailOtpDeliveryStatusImpl();
  },
);

export const requestStaffEmailOtp = createServerFn({ method: "POST" })
  .inputValidator(requestSchema)
  .handler(async ({ data }) => {
    const { requestStaffEmailOtpImpl } = await import("@kate/api/staff-email-otp.server");
    return requestStaffEmailOtpImpl(data);
  });

export const verifyStaffEmailOtp = createServerFn({ method: "POST" })
  .inputValidator(verifySchema)
  .handler(async ({ data }) => {
    const { verifyStaffEmailOtpImpl } = await import("@kate/api/staff-email-otp.server");
    return verifyStaffEmailOtpImpl(data);
  });
