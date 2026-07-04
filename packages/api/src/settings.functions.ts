import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { requireOwnerAuth } from "@kate/api/auth-middleware.server";
import { auditFromServer } from "@kate/api/audit.server";
import { sanitizeAuditSnapshot } from "@/lib/audit";
import { INVENTORY_MODES } from "@kate/domain/db/contracts";

const settingsSchema = z.object({
  shop_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(30),
  whatsapp: z.string().trim().max(30),
  email: z.string().trim().max(120),
  address: z.string().trim().max(500),
  logo_url: z.string().trim().max(500),
  meta_title: z.string().trim().max(120),
  meta_description: z.string().trim().max(320),
  about_text: z.string().trim().max(2000),
  hero_title: z.string().trim().max(120),
  hero_subtitle: z.string().trim().max(240),
  instagram: z.string().trim().max(120),
  tiktok: z.string().trim().max(120),
  facebook: z.string().trim().max(120),
  mtn_momo_merchant_code: z.string().trim().max(60),
  mtn_momo_merchant_name: z.string().trim().max(120),
  airtel_merchant_code: z.string().trim().max(60),
  airtel_merchant_name: z.string().trim().max(120),
  bank_transfer_instructions: z.string().trim().max(2000),
  notify_template_order_placed: z.string().trim().max(2000),
  notify_template_payment_confirmed: z.string().trim().max(2000),
  notify_template_order_shipped: z.string().trim().max(2000),
  inventory_mode: z.enum(INVENTORY_MODES),
});

const partialSettingsSchema = settingsSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one setting field is required",
  });

export const updateSettingsPartial = createServerFn({ method: "POST" })
  .middleware([requireOwnerAuth])
  .inputValidator(partialSettingsSchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as { userId: string };

    const { data: before, error: loadErr } = await supabaseAdmin
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (loadErr) throw new Error(loadErr.message);
    if (!before) throw new Error("Settings row missing (id=1).");

    const merged = settingsSchema.parse({ ...before, ...data });

    const { error } = await supabaseAdmin.from("settings").update(data).eq("id", 1);
    if (error) throw new Error(error.message);

    await auditFromServer(
      auth.userId,
      "settings_changed",
      "settings",
      "1",
      sanitizeAuditSnapshot("settings", (before ?? {}) as Record<string, unknown>),
      sanitizeAuditSnapshot("settings", merged as Record<string, unknown>),
    );

    return { ok: true };
  });

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireOwnerAuth])
  .inputValidator(settingsSchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as { userId: string };

    const { data: before, error: loadErr } = await supabaseAdmin
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (loadErr) throw new Error(loadErr.message);

    const { error } = await supabaseAdmin.from("settings").update(data).eq("id", 1);
    if (error) throw new Error(error.message);

    await auditFromServer(
      auth.userId,
      "settings_changed",
      "settings",
      "1",
      sanitizeAuditSnapshot("settings", (before ?? {}) as Record<string, unknown>),
      sanitizeAuditSnapshot("settings", data as Record<string, unknown>),
    );

    return { ok: true };
  });
