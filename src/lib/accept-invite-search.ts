import { z } from "zod";

/** Coerce invite search params — WhatsApp / browsers may pass odd shapes. */
export const acceptInviteSearchSchema = z.object({
  token: z.preprocess((value) => {
    if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : undefined;
    if (typeof value === "string") return value;
    return undefined;
  }, z.string().optional()),
  skip_app_probe: z.preprocess((value) => {
    if (value === true || value === 1 || value === "1" || value === "true") return "1";
    return undefined;
  }, z.literal("1").optional()),
});

export type AcceptInviteSearch = z.infer<typeof acceptInviteSearchSchema>;
