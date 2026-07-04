import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { requireStaffAuth } from "@kate/api/auth-middleware.server";
import type { AuthContext } from "@kate/api/auth-middleware.server";

const registerSchema = z.object({
  token: z.string().min(1).max(4096),
  platform: z.enum(["fcm", "web"]).default("fcm"),
  deviceLabel: z.string().max(120).optional(),
});

export const registerStaffPushToken = createServerFn({ method: "POST" })
  .middleware([requireStaffAuth])
  .inputValidator(registerSchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as AuthContext;
    const now = new Date().toISOString();

    const { error } = await supabaseAdmin.from("staff_push_subscriptions").upsert(
      {
        user_id: auth.userId,
        platform: data.platform,
        token: data.token,
        device_label: data.deviceLabel?.trim() || null,
        enabled: true,
        updated_at: now,
      },
      { onConflict: "user_id,token" },
    );

    if (error) throw new Error(error.message);
    return { ok: true };
  });

const setEnabledSchema = z.object({
  enabled: z.boolean(),
  token: z.string().min(1).max(4096).optional(),
});

export const setStaffPushEnabled = createServerFn({ method: "POST" })
  .middleware([requireStaffAuth])
  .inputValidator(setEnabledSchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as AuthContext;
    let query = supabaseAdmin
      .from("staff_push_subscriptions")
      .update({ enabled: data.enabled, updated_at: new Date().toISOString() })
      .eq("user_id", auth.userId);

    if (data.token) {
      query = query.eq("token", data.token);
    }

    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getStaffPushStatus = createServerFn({ method: "GET" })
  .middleware([requireStaffAuth])
  .handler(async ({ context }) => {
    const auth = context.auth as AuthContext;
    const { data, error } = await supabaseAdmin
      .from("staff_push_subscriptions")
      .select("id, platform, device_label, enabled, updated_at")
      .eq("user_id", auth.userId)
      .eq("enabled", true)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return {
      enabled: (data ?? []).length > 0,
      devices: data ?? [],
      serverConfigured: process.env.STAFF_PUSH_ENABLED === "true",
    };
  });
