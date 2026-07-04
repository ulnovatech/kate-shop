import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { brandingFromSettings, type StoreBranding } from "@/lib/store-branding";

const SETTINGS_BRANDING_SELECT =
  "shop_name, meta_title, meta_description, phone, whatsapp, email, address, logo_url, hero_title, hero_subtitle, about_text, instagram, tiktok, facebook";

export async function loadStoreBranding(): Promise<StoreBranding> {
  const { data } = await supabaseAdmin
    .from("settings")
    .select(SETTINGS_BRANDING_SELECT)
    .eq("id", 1)
    .maybeSingle();

  return brandingFromSettings(data);
}

export const getStoreBranding = createServerFn({ method: "GET" }).handler(async () => {
  return loadStoreBranding();
});
