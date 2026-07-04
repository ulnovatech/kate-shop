import { supabaseAdmin } from "@kate/supabase/client.server";
import { computeDeliveryQuote, type DeliveryConfig } from "@/lib/delivery";

export async function loadDeliveryConfigAdmin(): Promise<DeliveryConfig> {
  const [zonesRes, rulesRes] = await Promise.all([
    supabaseAdmin
      .from("delivery_zones")
      .select("*, delivery_zone_areas(*)")
      .eq("is_active", true)
      .order("sort_order"),
    supabaseAdmin.from("delivery_rules").select("*").eq("id", 1).maybeSingle(),
  ]);

  if (zonesRes.error) throw zonesRes.error;
  if (!rulesRes.data) throw new Error("Delivery rules not configured");

  return {
    zones: (zonesRes.data ?? []).map((z) => ({
      ...z,
      delivery_zone_areas: [...(z.delivery_zone_areas ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    })),
    rules: rulesRes.data,
  };
}

export function assertDeliveryQuote(
  config: DeliveryConfig,
  input: {
    delivery_area: string;
    subtotal: number;
    delivery_fee: number;
    grand_total: number;
    express_delivery: boolean;
    cash_on_delivery: boolean;
  },
): { zoneId: string } {
  const quote = computeDeliveryQuote(config, input.delivery_area, input.subtotal, {
    express: input.express_delivery,
    cod: input.cash_on_delivery,
  });

  if (!quote.valid || !quote.zoneId) {
    throw new Error("Invalid or unavailable delivery area");
  }

  const expectedTotal = input.subtotal + quote.fee;
  if (Math.round(quote.fee) !== Math.round(input.delivery_fee)) {
    throw new Error("Delivery fee mismatch — refresh checkout and try again");
  }
  if (Math.round(expectedTotal) !== Math.round(input.grand_total)) {
    throw new Error("Order total mismatch — refresh checkout and try again");
  }

  return { zoneId: quote.zoneId };
}
