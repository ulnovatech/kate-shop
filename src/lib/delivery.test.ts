import { describe, expect, it } from "vitest";
import { computeDeliveryQuote, findAreaInConfig } from "@/lib/delivery";
import { mockDeliveryConfig } from "../../tests/fixtures/delivery";

describe("findAreaInConfig", () => {
  it("finds seeded Kampala areas", () => {
    const config = mockDeliveryConfig();
    const hit = findAreaInConfig(config, "Kololo");
    expect(hit?.zone.zone_number).toBe(1);
    expect(hit?.areaName).toBe("Kololo");
  });

  it("returns null for unknown areas", () => {
    expect(findAreaInConfig(mockDeliveryConfig(), "Nowhere")).toBeNull();
  });
});

describe("computeDeliveryQuote", () => {
  const config = mockDeliveryConfig();

  it("charges zone fee for a standard order", () => {
    const q = computeDeliveryQuote(config, "Kololo", 50_000);
    expect(q.valid).toBe(true);
    expect(q.fee).toBe(5000);
    expect(q.zoneNumber).toBe(1);
    expect(q.breakdown.some((b) => b.includes("Zone 1"))).toBe(true);
  });

  it("applies free delivery in zones 1–2 above threshold", () => {
    const q = computeDeliveryQuote(config, "Kololo", 250_000);
    expect(q.valid).toBe(true);
    expect(q.fee).toBe(0);
    expect(q.breakdown.some((b) => b.includes("Free delivery in Zone 1"))).toBe(true);
  });

  it("applies global free delivery above all-zones threshold", () => {
    const q = computeDeliveryQuote(config, "Kira", 400_000);
    expect(q.valid).toBe(true);
    expect(q.fee).toBe(0);
    expect(q.breakdown.some((b) => b.includes("Free delivery (order above"))).toBe(true);
  });

  it("adds express and COD surcharges", () => {
    const q = computeDeliveryQuote(config, "Kololo", 50_000, { express: true, cod: true });
    expect(q.fee).toBe(5000 + 5000 + 2000);
    expect(q.breakdown).toHaveLength(3);
  });

  it("is invalid for unknown delivery area", () => {
    const q = computeDeliveryQuote(config, "Entebbe Airport", 50_000);
    expect(q.valid).toBe(false);
    expect(q.fee).toBe(0);
  });
});
