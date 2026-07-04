import { describe, expect, it } from "vitest";
import { dashboardInsightsSections } from "@/components/admin/dashboard-insights-nav";

describe("dashboardInsightsSections", () => {
  it("includes inventory when catalog is visible", () => {
    const sections = dashboardInsightsSections(true);
    expect(sections.map((s) => s.id)).toEqual(["revenue", "orders", "customers", "inventory"]);
  });

  it("omits inventory without catalog access", () => {
    const sections = dashboardInsightsSections(false);
    expect(sections.map((s) => s.id)).toEqual(["revenue", "orders", "customers"]);
  });
});
