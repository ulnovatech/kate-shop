import { supabase } from "@/integrations/supabase/client";
import type { DeliveryRulesRow, DeliveryZoneRow } from "@/lib/db/contracts";

export type DeliveryAreaRow = {
  id: string;
  area_name: string;
  sort_order: number;
  zone_id: string;
};

export type DeliveryZoneWithAreas = DeliveryZoneRow & {
  delivery_zone_areas: DeliveryAreaRow[];
};

export type DeliveryConfig = {
  zones: DeliveryZoneWithAreas[];
  rules: DeliveryRulesRow;
};

export type DeliveryQuote = {
  fee: number;
  zoneId: string | null;
  zoneNumber: number | null;
  breakdown: string[];
  valid: boolean;
};

export async function loadCheckoutDeliveryConfig(): Promise<DeliveryConfig> {
  const [zonesRes, rulesRes] = await Promise.all([
    supabase
      .from("delivery_zones")
      .select("*, delivery_zone_areas(*)")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("delivery_rules").select("*").eq("id", 1).maybeSingle(),
  ]);

  if (zonesRes.error) throw zonesRes.error;
  if (!rulesRes.data) {
    throw new Error("Delivery is not configured. Please contact the shop.");
  }

  const zones = (zonesRes.data ?? []).map((z) => ({
    ...z,
    delivery_zone_areas: [...(z.delivery_zone_areas ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
  }));

  if (!zones.length) {
    throw new Error("No delivery zones are available.");
  }

  return { zones, rules: rulesRes.data };
}

export async function loadAdminDeliveryConfig(): Promise<DeliveryConfig> {
  const [zonesRes, rulesRes] = await Promise.all([
    supabase.from("delivery_zones").select("*, delivery_zone_areas(*)").order("sort_order"),
    supabase.from("delivery_rules").select("*").eq("id", 1).maybeSingle(),
  ]);

  if (zonesRes.error) throw zonesRes.error;
  if (!rulesRes.data) throw new Error("Delivery rules row missing (id=1).");

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

export function findAreaInConfig(
  config: DeliveryConfig,
  areaName: string,
): { zone: DeliveryZoneWithAreas; areaName: string } | null {
  for (const zone of config.zones) {
    const hit = zone.delivery_zone_areas.find((a) => a.area_name === areaName);
    if (hit) return { zone, areaName: hit.area_name };
  }
  return null;
}

function formatUgx(n: number) {
  return `UGX ${Math.round(n).toLocaleString("en-UG")}`;
}

export function computeDeliveryQuote(
  config: DeliveryConfig,
  areaName: string,
  subtotal: number,
  opts: { express?: boolean; cod?: boolean } = {},
): DeliveryQuote {
  const match = findAreaInConfig(config, areaName);
  if (!match) {
    return { fee: 0, zoneId: null, zoneNumber: null, breakdown: [], valid: false };
  }

  const { zone } = match;
  const { rules } = config;
  const breakdown: string[] = [];
  let base = Number(zone.fee);

  if (subtotal >= Number(rules.free_delivery_all_zones_threshold)) {
    base = 0;
    breakdown.push(
      `Free delivery (order above ${formatUgx(rules.free_delivery_all_zones_threshold)})`,
    );
  } else {
    const zoneThreshold =
      zone.free_delivery_threshold ??
      (zone.zone_number <= 2 ? Number(rules.free_delivery_zones_1_2_threshold) : null);

    if (zoneThreshold != null && subtotal >= zoneThreshold) {
      base = 0;
      breakdown.push(
        `Free delivery in Zone ${zone.zone_number} (order above ${formatUgx(zoneThreshold)})`,
      );
    } else {
      breakdown.push(
        `Zone ${zone.zone_number} delivery to ${match.areaName}: ${formatUgx(zone.fee)}`,
      );
    }
  }

  let total = base;
  if (opts.express) {
    total += Number(rules.express_delivery_fee);
    breakdown.push(`Express delivery: +${formatUgx(rules.express_delivery_fee)}`);
  }
  if (opts.cod) {
    total += Number(rules.cod_fee);
    breakdown.push(`Cash on delivery: +${formatUgx(rules.cod_fee)}`);
  }

  return {
    fee: total,
    zoneId: zone.id,
    zoneNumber: zone.zone_number,
    breakdown,
    valid: true,
  };
}
