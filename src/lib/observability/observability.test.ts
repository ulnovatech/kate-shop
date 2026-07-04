import { describe, expect, it } from "vitest";
import { resolveHealthStatus } from "@/lib/observability/health.server";
import {
  generateRequestId,
  getRequestIdHeaderName,
  resolveRequestId,
} from "@/lib/observability/request-id";

describe("request-id", () => {
  it("uses incoming header when present", () => {
    expect(resolveRequestId("abc-123")).toBe("abc-123");
  });

  it("generates id when header missing", () => {
    const id = resolveRequestId(undefined);
    expect(id.length).toBeGreaterThan(8);
  });

  it("generates uuid-shaped ids", () => {
    const id = generateRequestId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("exposes stable header name", () => {
    expect(getRequestIdHeaderName()).toBe("x-request-id");
  });
});

describe("health status", () => {
  it("marks supabase errors as degraded", () => {
    expect(resolveHealthStatus("error")).toBe("degraded");
  });

  it("marks ok and skipped as healthy", () => {
    expect(resolveHealthStatus("ok")).toBe("healthy");
    expect(resolveHealthStatus("skipped")).toBe("healthy");
  });
});
