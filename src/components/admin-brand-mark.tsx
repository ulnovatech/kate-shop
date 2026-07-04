import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { brandingFromSettings } from "@/lib/store-branding";

/** Shop name for admin chrome (login, setup, sidebar). */
export function useAdminShopName(): string {
  const { data } = useQuery({
    queryKey: ["admin-shop-name"],
    queryFn: async () =>
      (await supabase.from("settings").select("shop_name").eq("id", 1).maybeSingle()).data,
    staleTime: 60_000,
  });
  return brandingFromSettings(data).shopName;
}

export function AdminBrandMark({ subtitle }: { subtitle?: string }) {
  const shopName = useAdminShopName();

  return (
    <Link to="/" className="block">
      <span className="font-heading text-lg font-semibold text-gold">{shopName}</span>
      {subtitle && (
        <p className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60">
          {subtitle}
        </p>
      )}
    </Link>
  );
}
