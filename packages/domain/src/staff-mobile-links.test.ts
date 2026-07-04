import { describe, expect, it } from "vitest";
import {
  buildStaffOrderDeepLink,
  isStaffOrderDeepLink,
  parseStaffOrderIdFromUrl,
  staffOrderPath,
} from "./staff-mobile-links";

describe("staff mobile order deep links", () => {
  it("builds order deep link and web path", () => {
    expect(buildStaffOrderDeepLink("abc-123")).toBe("com.kate.admin://orders/abc-123");
    expect(staffOrderPath("abc-123")).toBe("/orders/abc-123");
  });

  it("parses order id from deep link", () => {
    const url = "com.kate.admin://orders/550e8400-e29b-41d4-a716-446655440000";
    expect(isStaffOrderDeepLink(url)).toBe(true);
    expect(parseStaffOrderIdFromUrl(url)).toBe("550e8400-e29b-41d4-a716-446655440000");
  });
});
