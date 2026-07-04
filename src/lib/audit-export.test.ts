import { describe, expect, it } from "vitest";
import { auditLogsToCsv } from "@/lib/audit-export";
import type { AuditLogListItem } from "@/lib/api/audit.functions";

const sample: AuditLogListItem = {
  id: "1",
  actor_id: "a",
  actor_email: "kate@example.com",
  action: "order_updated",
  entity_type: "order",
  entity_id: "ord-1",
  payload: {
    before: { order_status: "pending" },
    after: { order_status: "confirmed" },
  },
  ip_address: null,
  created_at: "2026-06-07T10:00:00.000Z",
};

describe("auditLogsToCsv", () => {
  it("exports header and row", () => {
    const csv = auditLogsToCsv([sample]);
    expect(csv).toContain("when,actor,action");
    expect(csv).toContain("kate@example.com");
    expect(csv).toContain("pending → confirmed");
  });
});
