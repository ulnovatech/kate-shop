import type { DeliveryConfig } from "@/lib/delivery";

/** Minimal delivery config for unit tests (mirrors Chunk 3 seed shape). */
export function mockDeliveryConfig(): DeliveryConfig {
  const zone1Id = "zone-1";
  const zone3Id = "zone-3";

  return {
    rules: {
      id: 1,
      express_delivery_fee: 5000,
      cod_fee: 2000,
      free_delivery_zones_1_2_threshold: 200_000,
      free_delivery_all_zones_threshold: 350_000,
      currency: "UGX",
    },
    zones: [
      {
        id: zone1Id,
        zone_number: 1,
        name: "Zone 1 — Central Kampala",
        fee: 5000,
        description: null,
        estimated_days: null,
        free_delivery_threshold: null,
        is_active: true,
        sort_order: 1,
        delivery_zone_areas: [
          { id: "a1", area_name: "Kololo", sort_order: 3, zone_id: zone1Id },
          { id: "a2", area_name: "Kampala CBD", sort_order: 1, zone_id: zone1Id },
        ],
      },
      {
        id: zone3Id,
        zone_number: 3,
        name: "Zone 3 — Outer suburbs",
        fee: 10_000,
        description: null,
        estimated_days: null,
        free_delivery_threshold: null,
        is_active: true,
        sort_order: 3,
        delivery_zone_areas: [{ id: "a3", area_name: "Kira", sort_order: 1, zone_id: zone3Id }],
      },
    ],
  };
}
