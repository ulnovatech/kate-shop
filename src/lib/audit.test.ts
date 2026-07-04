import { describe, expect, it } from "vitest";
import {
  auditActionLabel,
  auditEntityLabel,
  buildAuditPayload,
  isAuditVisibleToManager,
  sanitizeAuditSnapshot,
} from "@/lib/audit";

describe("isAuditVisibleToManager", () => {
  it("hides settings and team events from managers", () => {
    expect(isAuditVisibleToManager({ action: "settings_changed", entity_type: "settings" })).toBe(
      false,
    );
    expect(isAuditVisibleToManager({ action: "invite_created", entity_type: "invite" })).toBe(
      false,
    );
    expect(isAuditVisibleToManager({ action: "role_assigned", entity_type: "user" })).toBe(false);
  });

  it("shows operational events to managers", () => {
    expect(isAuditVisibleToManager({ action: "order_updated", entity_type: "order" })).toBe(true);
    expect(isAuditVisibleToManager({ action: "payment_recorded", entity_type: "payment" })).toBe(
      true,
    );
    expect(isAuditVisibleToManager({ action: "product_updated", entity_type: "product" })).toBe(
      true,
    );
    expect(isAuditVisibleToManager({ action: "inventory_changed", entity_type: "inventory" })).toBe(
      true,
    );
  });
});

describe("sanitizeAuditSnapshot", () => {
  it("strips notification templates from settings diffs", () => {
    const out = sanitizeAuditSnapshot("settings", {
      shop_name: "Test Shop",
      notify_template_order_placed: "secret template",
    });
    expect(out).toEqual({ shop_name: "Test Shop" });
  });

  it("passes through non-settings snapshots unchanged", () => {
    const input = { name: "Widget", price: 1000 };
    expect(sanitizeAuditSnapshot("product", input)).toEqual(input);
  });
});

describe("buildAuditPayload", () => {
  it("includes before and after snapshots", () => {
    const payload = buildAuditPayload({ status: "pending" }, { status: "paid" }, "order");
    expect(payload.before).toEqual({ status: "pending" });
    expect(payload.after).toEqual({ status: "paid" });
  });
});

describe("audit labels", () => {
  it("formats action and entity labels", () => {
    expect(auditActionLabel("payment_recorded")).toBe("Payment recorded");
    expect(auditEntityLabel("order")).toBe("Order");
  });
});
